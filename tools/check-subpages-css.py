#!/usr/bin/env python3
"""Check that subpages.css has not drifted from styles.css.

index.html loads the full styles.css. faq.html, alice-in-wonderland.html and
jersey-boys.html load subpages.css, a hand-maintained subset of it. Nothing
generates that subset, so a rule edited in styles.css can silently stop matching
its copy in subpages.css and the subpages quietly render with stale styling.

This compares every selector the two sheets share and fails if the declarations
differ. Selectors that exist only in styles.css are expected (subpages.css is a
subset) and are ignored. Selectors that exist only in subpages.css are reported
as a warning, since they are usually leftovers from a rule that was renamed or
removed upstream.

Comparison is context-aware: a selector inside @media (max-width: 768px) is only
compared against the same selector inside the same at-rule, so a rule that
differs between breakpoints is not mistaken for drift. Grouped selectors
(".a, .b { }") are split so a rule dropping one selector from the group is still
caught.

Usage:
    python3 tools/check-subpages-css.py            # check, exit 1 on drift
    python3 tools/check-subpages-css.py --verbose  # also list shared selectors

Exits 0 when clean, 1 on drift, 2 if a file is missing or unparseable.
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FULL = ROOT / "styles.css"
SUBSET = ROOT / "subpages.css"

# At-rules that wrap other rules rather than declaring properties themselves.
# @keyframes belongs here: its children are keyframe selectors ("0%", "from"),
# which are only meaningful scoped to their animation — without this every "0%"
# in the sheet collapses into one bucket and every animation looks like drift.
NESTING_AT_RULES = ("@media", "@supports", "@container", "@layer", "@scope", "@keyframes")

# Divergences that are real but do not render, recorded so this check can exit 0
# on a clean tree and fail only on something new. Each needs a reason; delete an
# entry once the underlying rule is reconciled.
#
# Format: (at-rule context, selector)
KNOWN_DIVERGENCES = {
    ("", ".article-reader-body > .captioned-image-container:first-child"):
        "The Substack article reader is built by main.js, which only index.html "
        "loads, so no subpages.css page ever has .article-reader-body. The copy "
        "in subpages.css is a leftover from when the subset was cut.",
    ("@keyframes shimmer", "0%"):
        "styles.css declares @keyframes shimmer twice; the later one (a "
        "background-position scroll for .feed-item.loading-placeholder) wins "
        "there. Its only other consumer, .bts-photo:hover::after, exists solely "
        "on alice-in-wonderland.html, which loads subpages.css and gets the "
        "intended translateX sweep. Nothing renders the difference.",
    ("@keyframes shimmer", "100%"):
        "See @keyframes shimmer 0%.",
}


def strip_comments(css: str) -> str:
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def normalize(text: str) -> str:
    """Collapse whitespace so formatting differences are not reported as drift."""
    return " ".join(text.split())


def normalize_declarations(block: str) -> str:
    """Normalize a declaration block without reordering it — order is significant
    in CSS when the same property is set twice."""
    parts = [normalize(p) for p in block.split(";")]
    return "; ".join(p for p in parts if p)


def merge_declarations(blocks: list[str]) -> str:
    """Collapse repeated rules for one selector into their effective result.

    A selector declared more than once at equal specificity resolves to the last
    value of each property, so comparing the merged result is what actually
    matters. Without this, "styles.css declares .foo twice" reads as drift even
    when both sheets end up painting identically.
    """
    effective: dict[str, str] = {}
    for block in blocks:
        for decl in block.split(";"):
            if ":" not in decl:
                continue
            prop, _, value = decl.partition(":")
            effective[normalize(prop).lower()] = normalize(value)
    return "; ".join(f"{p}: {v}" for p, v in sorted(effective.items()))


def parse(css: str, path: Path) -> dict[tuple[str, str], list[str]]:
    """Return {(at-rule context, selector): [declaration blocks in source order]}.

    A tiny brace-matching walker rather than a real CSS parser — enough for these
    two sheets, which are plain nested-at-rule CSS with no exotic syntax.

    Re-declaring @keyframes with a name already used replaces the earlier
    animation outright rather than merging with it, so only the last block for a
    given name is kept.
    """
    css = strip_comments(css)
    rules: dict[tuple[str, str], list[str]] = defaultdict(list)
    context: list[str] = []
    buf = ""
    depth = 0
    # (depth at which it was opened) for each context entry, so we pop correctly
    context_depth: list[int] = []
    # every @keyframes name seen, in order, so duplicates can be resolved after
    keyframe_instances: list[str] = []

    for ch in css:
        if ch == "{":
            prelude = normalize(buf)
            buf = ""
            depth += 1
            if prelude.startswith(NESTING_AT_RULES):
                if prelude.startswith("@keyframes"):
                    # tag each block so a redefined animation gets its own key
                    keyframe_instances.append(prelude)
                    prelude = f"{prelude}#{keyframe_instances.count(prelude) - 1}"
                context.append(prelude)
                context_depth.append(depth)
            else:
                # a style rule (or a non-nesting at-rule such as @font-face)
                context.append(None)  # marker: this block holds declarations
                context_depth.append(depth)
                context[-1] = ("__RULE__", prelude)
        elif ch == "}":
            if not context:
                raise ValueError(f"{path.name}: unbalanced '}}'")
            entry = context.pop()
            context_depth.pop()
            if isinstance(entry, tuple) and entry[0] == "__RULE__":
                prelude = entry[1]
                decls = normalize_declarations(buf)
                if not prelude.startswith("@"):
                    ctx = " > ".join(c for c in context if isinstance(c, str))
                    for sel in (s.strip() for s in prelude.split(",")):
                        if sel:
                            rules[(ctx, normalize(sel))].append(decls)
            buf = ""
            depth -= 1
        else:
            buf += ch

    if context:
        raise ValueError(f"{path.name}: unbalanced '{{' — {len(context)} block(s) left open")

    # Collapse @keyframes instances down to the last one declared for each name,
    # which is the only one the browser actually uses.
    last_instance = {}
    for name in keyframe_instances:
        last_instance[name] = keyframe_instances.count(name) - 1
    resolved: dict[tuple[str, str], list[str]] = {}
    for (ctx, sel), blocks in rules.items():
        m = re.match(r"^(@keyframes [^#]+)#(\d+)$", ctx)
        if m:
            name, idx = m.group(1), int(m.group(2))
            if idx != last_instance[name]:
                continue  # superseded by a later @keyframes of the same name
            ctx = name
        resolved[(ctx, sel)] = blocks
    return resolved


def main() -> int:
    ap = argparse.ArgumentParser(description="Check subpages.css against styles.css")
    ap.add_argument("--verbose", action="store_true", help="list every shared selector")
    args = ap.parse_args()

    for p in (FULL, SUBSET):
        if not p.exists():
            print(f"error: {p} not found", file=sys.stderr)
            return 2

    try:
        full = parse(FULL.read_text(encoding="utf-8"), FULL)
        subset = parse(SUBSET.read_text(encoding="utf-8"), SUBSET)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    shared = sorted(set(full) & set(subset))
    only_subset = sorted(set(subset) - set(full))

    diverged = [k for k in shared if merge_declarations(full[k]) != merge_declarations(subset[k])]
    drift = [k for k in diverged if k not in KNOWN_DIVERGENCES]
    baselined = [k for k in diverged if k in KNOWN_DIVERGENCES]
    # An allowlist entry that no longer matches anything means the rule was fixed
    # (or renamed) and the entry should go, so say so rather than staying quiet.
    stale_allowlist = [k for k in KNOWN_DIVERGENCES if k not in diverged]

    def label(key: tuple[str, str]) -> str:
        ctx, sel = key
        return f"{sel}   [{ctx}]" if ctx else sel

    if args.verbose:
        for key in shared:
            print(f"  ok  {label(key)}")

    for key in drift:
        a, b = merge_declarations(full[key]), merge_declarations(subset[key])
        a_props = dict(d.split(": ", 1) for d in a.split("; ") if ": " in d)
        b_props = dict(d.split(": ", 1) for d in b.split("; ") if ": " in d)
        print(f"\nDRIFT  {label(key)}")
        for prop in sorted(set(a_props) | set(b_props)):
            av, bv = a_props.get(prop), b_props.get(prop)
            if av != bv:
                print(f"    {prop}:")
                print(f"        styles.css   : {av if av is not None else '(not set)'}")
                print(f"        subpages.css : {bv if bv is not None else '(not set)'}")

    if only_subset:
        print(f"\nwarning: {len(only_subset)} selector(s) exist only in subpages.css "
              f"(likely stale — renamed or removed in styles.css):")
        for key in only_subset[:20]:
            print(f"    {label(key)}")
        if len(only_subset) > 20:
            print(f"    ... and {len(only_subset) - 20} more")

    if stale_allowlist:
        print("\nnote: KNOWN_DIVERGENCES entries that no longer diverge — remove them:")
        for key in stale_allowlist:
            print(f"    {label(key)}")

    print(f"\n{len(shared)} shared selectors compared, {len(drift)} drifted, "
          f"{len(baselined)} known-benign.")
    if drift:
        print("\nsubpages.css is out of sync with styles.css. Mirror the change above,")
        print("then re-run this check.")
        return 1

    print("subpages.css is in sync with styles.css.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

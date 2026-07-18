// Convert the Codex-exported "Surviving Salem" transcript markdown into an
// HTML fragment for the site's article reader modal. One-shot build tool —
// the checked-in artifact is transcripts/surviving-salem-transcript.html.
import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error("Usage: node build-transcript-html.mjs <in.md> <out.html>");

const IMAGE_DIMENSIONS = {
  "cw-engraved-editorial-mark": [1254, 1254],
  "dynamic-manuscript-trial-composition": [1774, 887],
  "invisible-mediation": [1536, 1024],
  "rented-democratization": [1536, 1024],
  "the-accusation-creates-the-witch-second-variation": [1677, 938],
  "the-accusation-creates-the-witch": [1536, 1024],
  "the-manuscript-on-trial": [1774, 887],
};
const IMAGE_BASE = "/images/transcripts/surviving-salem";

const SPEAKERS = {
  "Charles": { label: "Charles", classes: "transcript-turn transcript-turn--charles" },
  "Codex": { label: "Codex", classes: "transcript-turn transcript-turn--codex" },
  "Codex — process update": { label: "Codex · process update", classes: "transcript-turn transcript-turn--codex transcript-turn--process" },
};

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, (m, code) => `<code>${code}</code>`);
  // Links whose URL the exporter redacted: [text]([local path omitted])
  out = out.replace(/\[([^\]]+)\]\(\[local path omitted\]\)/g, `$1 <span class="transcript-dead-link">[local file omitted from export]</span>`);
  // Links; drop the anchor for mangled URLs (double-percent-encoded junk from the export).
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    if (/%25/i.test(url) || /\.apk$/i.test(url)) return `${label} <span class="transcript-dead-link">[link removed — malformed URL in export]</span>`;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(“"'>—-])\*([^*\n]+)\*(?=[\s)。.,;:!?”"'<—-]|$)/g, "$1<em>$2</em>");
  return out;
}

function renderBlocks(lines) {
  const html = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i += 1; continue; }

    if (line.trim() === "<details>") {
      // Attachment block: <details><summary>…</summary> + ```text fence + </details>
      const detail = [];
      i += 1;
      let summary = "Attached text";
      const pre = [];
      while (i < lines.length && lines[i].trim() !== "</details>") {
        const l = lines[i];
        const sm = l.match(/^<summary>(.*)<\/summary>$/);
        if (sm) { summary = sm[1]; i += 1; continue; }
        if (/^```/.test(l.trim())) {
          i += 1;
          while (i < lines.length && !/^```/.test(lines[i].trim())) { pre.push(lines[i]); i += 1; }
          i += 1; // closing fence
          continue;
        }
        i += 1;
      }
      i += 1; // </details>
      html.push(`<details class="transcript-attachment"><summary>${escapeHtml(summary)}</summary><pre>${escapeHtml(pre.join("\n"))}</pre></details>`);
      continue;
    }

    const img = line.match(/^!\[([^\]]*)\]\(\.\/surviving-salem-transcript-assets\/([^)]+)\.(?:png|jpg|jpeg|webp)\)\s*$/);
    if (img) {
      const [, alt, name] = img;
      const dims = IMAGE_DIMENSIONS[name];
      const size = dims ? ` width="${dims[0]}" height="${dims[1]}"` : "";
      html.push(`<figure class="transcript-figure"><img src="${IMAGE_BASE}/${name}.webp" alt="${escapeHtml(alt)}"${size}><figcaption>${escapeHtml(alt)}</figcaption></figure>`);
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 5); // demote: md h1 -> h2, h2 -> h3, …
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, "")); i += 1; }
      const paras = quote.join("\n").split(/\n\s*\n/).filter(Boolean)
        .map(p => `<p>${inline(p.replace(/\n/g, " "))}</p>`).join("");
      html.push(`<blockquote>${paras}</blockquote>`);
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items = [];
      while (i < lines.length) {
        if (/^-\s+/.test(lines[i])) { items.push(lines[i].replace(/^-\s+/, "")); i += 1; continue; }
        // Loose list: blank lines between items stay in the same <ul>.
        if (!lines[i].trim()) {
          let peek = i;
          while (peek < lines.length && !lines[peek].trim()) peek += 1;
          if (peek < lines.length && /^-\s+/.test(lines[peek])) { i = peek; continue; }
        }
        break;
      }
      html.push(`<ul>${items.map(it => `<li>${inline(it)}</li>`).join("")}</ul>`);
      continue;
    }

    const ol = line.match(/^(\d+)\.\s+/);
    if (ol) {
      const start = parseInt(ol[1], 10);
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i += 1; }
      const startAttr = start !== 1 ? ` start="${start}"` : "";
      html.push(`<ol${startAttr}>${items.map(it => `<li>${inline(it)}</li>`).join("")}</ol>`);
      continue;
    }

    // Paragraph: gather until blank line or a block starter.
    const para = [];
    while (i < lines.length && lines[i].trim() &&
      !/^(#{1,4}\s|>\s?|-\s+|\d+\.\s+|!\[|<details>)/.test(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    html.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return html.join("\n");
}

const source = await readFile(inputPath, "utf8");
const allLines = source.split("\n");

// Split into speaker turns. A turn starts at "## <speaker>" where the heading
// text is exactly a known speaker; "---" separator lines are dropped.
const turns = [];
let current = null;
let frontMatter = [];

for (const line of allLines) {
  const h2 = line.match(/^##\s+(.*)$/);
  if (h2 && SPEAKERS[h2[1].trim()]) {
    if (current) turns.push(current);
    current = { speaker: h2[1].trim(), lines: [] };
    continue;
  }
  if (line.trim() === "---") continue;
  if (current) current.lines.push(line);
  else frontMatter.push(line);
}
if (current) turns.push(current);

const sections = turns.map(turn => {
  const meta = SPEAKERS[turn.speaker];
  return `<section class="${meta.classes}">\n<p class="transcript-speaker">${escapeHtml(meta.label)}</p>\n${renderBlocks(turn.lines)}\n</section>`;
});

const intro = `<div class="transcript-note"><p>A working session from July 18, 2026 between Charles Wilke and Codex, an OpenAI assistant — the conversation behind the essay <em>Surviving Salem: Vilify and Deny</em>. This export contains the visible conversation only: system instructions, internal reasoning, and tool internals are omitted. Text attachments are reproduced inline and private local file paths have been removed.</p></div>`;

await writeFile(outputPath, `${intro}\n${sections.join("\n")}\n`, "utf8");
console.log(`turns: ${turns.length}, bytes: ${(await readFile(outputPath)).length}`);

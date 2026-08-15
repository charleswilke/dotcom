// Convert the Codex-exported "Baby Steps" transcript markdown into an HTML
// fragment for the site's article reader modal. One-shot build tool — the
// checked-in artifact is transcripts/baby-steps-transcript.html.
//
// Sibling of build-transcript-html.mjs (Surviving Salem). Same output
// vocabulary, different source shape: this export nests "### CW" / "### Codex"
// speaker turns under "## Chapter" headings, carries YAML front matter, and
// includes fenced image prompts that render as visible blocks rather than the
// collapsed <details> attachments Salem used.
import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error("Usage: node build-baby-steps-transcript.mjs <in.md> <out.html>");

const IMAGE_DIMENSIONS = {
  "01-editorial-mac-shadow": [1774, 887],
  "02-anonymous-box-shadow": [1774, 887],
  "03-watercolor-bloom": [1774, 887],
  "04-watercolor-bloom-refined": [1774, 887],
  "05-watercolor-cast-shadow": [1774, 887],
  "06-pulp-cast-shadow": [1774, 887],
  "07-krea-pulp-draft": [1376, 768],
  "08-cw-monogram-final": [1254, 1254],
};
const IMAGE_BASE = "/images/transcripts/baby-steps";
const ASSET_DIR = "baby-steps-chat-assets";

const SPEAKERS = {
  "CW": { label: "Charles", classes: "transcript-turn transcript-turn--charles" },
  "Codex": { label: "Codex", classes: "transcript-turn transcript-turn--codex" },
};

const COLOPHON = /^\*Conversation edited for readability.*\*$/;

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, (m, code) => `<code>${code}</code>`);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) =>
    `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
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

    // Fenced block: the image prompts Codex hands over. Shown, not collapsed —
    // they're a substantial part of what this conversation produced.
    if (/^```/.test(line.trim())) {
      const pre = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { pre.push(lines[i]); i += 1; }
      i += 1; // closing fence
      html.push(`<pre class="transcript-prompt">${escapeHtml(pre.join("\n"))}</pre>`);
      continue;
    }

    const img = line.match(new RegExp(`^!\\[([^\\]]*)\\]\\(\\./${ASSET_DIR}/([^)]+)\\.(?:png|jpg|jpeg|webp)\\)\\s*$`));
    if (img) {
      const [, alt, name] = img;
      const dims = IMAGE_DIMENSIONS[name];
      if (!dims) throw new Error(`No dimensions recorded for image "${name}"`);
      html.push(`<figure class="transcript-figure"><img src="${IMAGE_BASE}/${name}.webp" alt="${escapeHtml(alt)}" width="${dims[0]}" height="${dims[1]}" loading="lazy" decoding="async"><figcaption>${escapeHtml(alt)}</figcaption></figure>`);
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      // Chapter headings are h2, so everything inside a turn demotes below that.
      const level = Math.min(heading[1].length + 2, 4);
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
      !/^(#{1,4}\s|>\s?|-\s+|\d+\.\s+|!\[|```)/.test(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    html.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return html.join("\n");
}

const source = await readFile(inputPath, "utf8");
let allLines = source.split("\n");

// Drop YAML front matter.
if (allLines[0].trim() === "---") {
  const end = allLines.indexOf("---", 1);
  if (end === -1) throw new Error("Unterminated front matter");
  allLines = allLines.slice(end + 1);
}

// Everything before the first speaker is the export's own title block and
// editor's note; the intro below replaces it.
const nodes = [];
let current = null;
let colophon = "";

for (const line of allLines) {
  if (COLOPHON.test(line.trim())) { colophon = line.trim().replace(/^\*|\*$/g, ""); continue; }

  const h3 = line.match(/^###\s+(.*)$/);
  if (h3 && SPEAKERS[h3[1].trim()]) {
    current = { type: "turn", speaker: h3[1].trim(), lines: [] };
    nodes.push(current);
    continue;
  }

  const h2 = line.match(/^##\s+(.*)$/);
  if (h2) {
    current = null;
    nodes.push({ type: "chapter", text: h2[1].trim() });
    continue;
  }

  if (line.trim() === "---") continue;
  if (current) current.lines.push(line);
}

const turnCount = nodes.filter(n => n.type === "turn").length;
if (!turnCount) throw new Error("No speaker turns found — check the export format");

const body = nodes.map(node => {
  if (node.type === "chapter") {
    return `<h2 class="transcript-chapter">${inline(node.text)}</h2>`;
  }
  const meta = SPEAKERS[node.speaker];
  return `<section class="${meta.classes}">\n<p class="transcript-speaker">${escapeHtml(meta.label)}</p>\n${renderBlocks(node.lines)}\n</section>`;
});

const intro = `<div class="transcript-note"><p>A working session from August 15, 2026 between Charles Wilke and Codex, an OpenAI assistant — the conversation behind the essay <em>Baby Steps</em>. It runs from a Saturday-morning brain dump through the drafts, the copyedit, and the search for the right enormous shadow. Routine progress messages and technical tool output have been removed; the creative discussion, drafts, prompts, and image iterations remain. One screenshot of the author&rsquo;s Mac mini specifications was left out because it also showed the computer&rsquo;s serial number.</p></div>`;

const outro = colophon
  ? `<div class="transcript-note transcript-note--end"><p>${inline(colophon)}</p></div>`
  : "";

await writeFile(outputPath, [intro, ...body, outro].filter(Boolean).join("\n") + "\n", "utf8");
console.log(`chapters: ${nodes.length - turnCount}, turns: ${turnCount}, bytes: ${(await readFile(outputPath)).length}`);

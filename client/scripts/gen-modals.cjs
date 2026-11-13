const fs = require('fs');
const html = fs.readFileSync('client/src/legacy/legacy-modals.html', 'utf8');
const modals = [];
let idx = 0;
while (true) {
  const start = html.indexOf('<div class="app-modal"', idx);
  if (start === -1) break;
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = start;
  let depth = 0;
  let end = null;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('</div')) {
      depth -= 1;
      if (depth === 0) {
        end = re.lastIndex;
        break;
      }
    } else {
      depth += 1;
    }
  }
  if (!end) break;
  const chunk = html.slice(start, end).trim();
  modals.push(chunk);
  idx = end;
}

const toPascal = (id) => {
  const cleaned = id.replace(/^[^a-zA-Z]+/, '');
  const parts = cleaned.split(/[-_]/g).filter(Boolean);
  let name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  if (!name.toLowerCase().endsWith('modal')) name += 'Modal';
  return name;
};

const modalDefs = modals.map((chunk) => {
  const idMatch = chunk.match(/id="([^"]+)"/);
  const id = idMatch ? idMatch[1] : 'UnknownModal';
  const name = toPascal(id);
  return { id, name, html: chunk };
});

const used = new Set();
modalDefs.forEach((def) => {
  const base = def.name;
  let name = base;
  let i = 2;
  while (used.has(name)) {
    name = base + i;
    i += 1;
  }
  used.add(name);
  def.name = name;
});

const lines = [];
lines.push('type ModalHtmlProps = { html: string };');
lines.push('const ModalHtml = ({ html }: ModalHtmlProps) => (');
lines.push('  <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />');
lines.push(');');
lines.push('');

modalDefs.forEach((def) => {
  lines.push(`const ${def.name}Html = ${JSON.stringify(def.html)};`);
  lines.push(`export function ${def.name}() {`);
  lines.push(`  return <ModalHtml html={${def.name}Html} />;`);
  lines.push('}');
  lines.push('');
});

lines.push('export function Modals() {');
lines.push('  return (');
lines.push('    <>');
modalDefs.forEach((def) => {
  lines.push(`      <${def.name} />`);
});
lines.push('    </>');
lines.push('  );');
lines.push('}');

fs.writeFileSync('client/src/components/Modals.tsx', lines.join('\n'));

#!/usr/bin/env node
/**
 * Pulls the 25 inlined JPEGs (and the two SVG marks) out of reference/prototype.html.
 *
 *   node scripts/extract-images.mjs [path/to/prototype.html]
 *
 * - Images: decoded from `const IMG={...}`, re-encoded with sharp (progressive JPEG, q80) and
 *   written to src/assets/images/<key>.jpg. Full-bleed images keep up to 2400px on the long edge,
 *   everything else is capped at 1600px. Next/image builds AVIF/WebP variants from these at build time.
 * - Icons: the LOGO placeholder and the House of Kletos credit are written as React components
 *   to src/components/icons/.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(process.argv[2] ?? path.join(root, 'reference/prototype.html'));
const imgDir = path.join(root, 'src/assets/images');
const iconDir = path.join(root, 'src/components/icons');

/** Images shown edge to edge (hero slides, band, Process hero, the as-built photo). */
const LARGE = new Set(['hero1', 'hero2', 'hero3', 'band', 'd10', 'wabuild']);
const KEYS = [
  'band', 'd10', 'entrance', 'exterior', 'facade', 'hero1', 'hero2', 'hero3', 'ivbed', 'ivliving',
  'kitchen', 'living', 'load1', 'load2', 'load3', 'pg1', 'pg2', 'pg3', 'pg4', 'pg5', 'pg6',
  'rcbed', 'rkcourt', 'stair', 'wabuild',
];

const html = await readFile(src, 'utf8');

/* ---------- images ---------- */
const start = html.indexOf('const IMG=');
if (start < 0) throw new Error('const IMG={...} not found in ' + src);
const objStart = html.indexOf('{', start);
const objEnd = html.indexOf('};', objStart);
const map = JSON.parse(html.slice(objStart, objEnd + 1));

const missing = KEYS.filter((k) => !map[k]);
if (missing.length) throw new Error('Missing image keys: ' + missing.join(', '));

await mkdir(imgDir, { recursive: true });
const kb = (n) => (n / 1024).toFixed(0).padStart(5) + ' KB';
const rows = [];
for (const key of KEYS) {
  const b64 = map[key].replace(/^data:image\/\w+;base64,/, '');
  const input = Buffer.from(b64, 'base64');
  const before = await sharp(input).metadata();
  const max = LARGE.has(key) ? 2400 : 1600;
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  await writeFile(path.join(imgDir, `${key}.jpg`), data);
  rows.push(
    `${key.padEnd(9)} ${`${before.width}×${before.height}`.padStart(10)} ${kb(input.length)}  →  ` +
      `${`${info.width}×${info.height}`.padStart(10)} ${kb(data.length)}`,
  );
}
console.log('key        original              →  output');
console.log(rows.join('\n'));

/* ---------- icons ---------- */
function grabSvg(marker) {
  const at = html.indexOf(marker);
  if (at < 0) throw new Error('SVG not found: ' + marker);
  const open = html.lastIndexOf('<svg', at);
  const close = html.indexOf('</svg>', at) + '</svg>'.length;
  return html.slice(open, close);
}
/** Turns the raw SVG into JSX: drops xmlns/role/aria (set by the component), camelCases attributes. */
function toJsx(svg) {
  return svg
    .replace(/\s(xmlns|role|aria-label)="[^"]*"/g, '')
    .replace(/fill="currentColor"/, '')
    .replace(/<svg\s*/, '<svg {...props} ')
    .replace(/text-anchor=/g, 'textAnchor=')
    .replace(/font-family=/g, 'fontFamily=')
    .replace(/font-weight=/g, 'fontWeight=')
    .replace(/font-size=/g, 'fontSize=')
    .replace(/letter-spacing=/g, 'letterSpacing=')
    .replace(/><\/(path|polygon|rect)>/g, ' />');
}
function component(name, label, svg) {
  return `// Extracted from reference/prototype.html by scripts/extract-images.mjs. Do not edit by hand.
import type { SVGProps } from 'react';

export default function ${name}({ title = '${label}', ...rest }: SVGProps<SVGSVGElement> & { title?: string }) {
  const props = { xmlns: 'http://www.w3.org/2000/svg', fill: 'currentColor', role: 'img', 'aria-label': title, ...rest };
  return (
    ${toJsx(svg)}
  );
}
`;
}
await mkdir(iconDir, { recursive: true });
await writeFile(path.join(iconDir, 'LogoMark.tsx'), component('LogoMark', 'Logo placeholder', grabSvg('>LOGO</text>')));
await writeFile(path.join(iconDir, 'KletosMark.tsx'), component('KletosMark', 'House of Kletos', grabSvg('aria-label="House of Kletos"')));
console.log('\nicons → src/components/icons/LogoMark.tsx, KletosMark.tsx');

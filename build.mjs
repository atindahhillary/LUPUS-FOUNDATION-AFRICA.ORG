#!/usr/bin/env node
/**
 * Lupus Foundation of Africa - static site builder
 *
 * Composes src/pages/*.html into root-level HTML files using src/layout.html
 * and the shared partials. Zero dependencies: `node build.mjs`.
 *
 * Each page begins with a JSON front-matter block:
 *   <!--meta { "title": "...", "description": "...", "nav": "about" } -->
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = dirname(fileURLToPath(import.meta.url));
const SRC = join(root, 'src');
const PAGES = join(SRC, 'pages');

const BASE = 'https://atindahhillary.github.io/LUPUS-FOUNDATION-AFRICA.ORG/';
const SITE_NAME = 'Lupus Foundation of Africa';

const layout = readFileSync(join(SRC, 'layout.html'), 'utf8');
const header = readFileSync(join(SRC, 'partials', 'header.html'), 'utf8');
const footer = readFileSync(join(SRC, 'partials', 'footer.html'), 'utf8');

const META_RE = /^\s*<!--meta([\s\S]*?)-->/;

function parsePage(raw, file) {
  const m = raw.match(META_RE);
  if (!m) throw new Error(`Missing <!--meta ... --> block in ${file}`);
  let meta;
  try {
    meta = JSON.parse(m[1].trim());
  } catch (err) {
    throw new Error(`Invalid JSON front matter in ${file}: ${err.message}`);
  }
  return { meta, body: raw.slice(m[0].length).trim() };
}

/**
 * Cache-busting. GitHub Pages caches static files for about ten minutes, so a
 * returning visitor could get new HTML against an old stylesheet. Each CSS and
 * JS reference gets ?v=<content hash>, which only changes when the file does.
 */
function fingerprint(html) {
  return html.replace(/(href|src)="(assets\/(?:css|js)\/[^"?]+\.(?:css|js))"/g, (m, attr, path) => {
    const hash = createHash('sha1').update(readFileSync(join(root, path))).digest('hex').slice(0, 10);
    return `${attr}="${path}?v=${hash}"`;
  });
}

/** Marks the active top-level nav item so CSS/AT can show current page. */
function markNav(html, nav) {
  if (!nav) return html;
  return html.replace(
    new RegExp(`(<li data-nav="${nav}")`, 'g'),
    '$1 aria-current="page"'
  );
}

function build() {
  const files = readdirSync(PAGES).filter((f) => f.endsWith('.html'));
  if (!files.length) throw new Error('No pages found in src/pages');

  const sitemap = [];

  for (const file of files) {
    const raw = readFileSync(join(PAGES, file), 'utf8');
    const { meta, body } = parsePage(raw, file);
    const slug = file === 'index.html' ? '' : file;

    const title = meta.title
      ? (meta.title.includes(SITE_NAME) ? meta.title : `${meta.title} | ${SITE_NAME}`)
      : SITE_NAME;

    const out = layout
      .replace(/\{\{TITLE\}\}/g, escapeAttr(title))
      .replace(/\{\{DESCRIPTION\}\}/g, escapeAttr(meta.description || ''))
      .replace(/\{\{SLUG\}\}/g, slug)
      .replace(/\{\{BASE\}\}/g, BASE)
      .replace(/\{\{EXTRA_HEAD\}\}/g, meta.head || '')
      .replace('{{HEADER}}', markNav(header, meta.nav))
      .replace('{{FOOTER}}', footer)
      .replace('{{BODY}}', body);

    if (out.includes('{{')) {
      const leftover = out.match(/\{\{[A-Z_]+\}\}/g);
      throw new Error(`Unreplaced placeholder(s) in ${file}: ${leftover.join(', ')}`);
    }

    writeFileSync(join(root, file), fingerprint(out), 'utf8');
    if (meta.noindex !== true) {
      sitemap.push({ loc: BASE + slug, priority: meta.priority || (slug ? '0.7' : '1.0') });
    }
    console.log(`  built  ${file.padEnd(28)} ${(out.length / 1024).toFixed(1)} KB`);
  }

  // sitemap.xml
  const today = new Date().toISOString().slice(0, 10);
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemap
      .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`)
      .join('\n') +
    `\n</urlset>\n`;
  writeFileSync(join(root, 'sitemap.xml'), xml, 'utf8');

  writeFileSync(
    join(root, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`,
    'utf8'
  );

  // GitHub Pages: do not run the output through Jekyll.
  writeFileSync(join(root, '.nojekyll'), '', 'utf8');

  console.log(`\n  ${files.length} pages, sitemap.xml and robots.txt written.`);
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

build();

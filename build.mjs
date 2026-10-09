// Static site builder for rameshm.com. No dependencies: run `node build.mjs`.
// Content lives in src/data/*.json and src/posts/*.md. Output goes to dist/.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'dist');

const readJson = (p) => JSON.parse(readFileSync(join(SRC, p), 'utf8'));
const site = readJson('data/site.json');
const skills = readJson('data/skills.json');
const projects = readJson('data/projects.json');
const apps = readJson('data/apps.json');

const SITE = site.url;
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/* ---------- helpers ---------- */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) =>
  s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const fmtDate = (d) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const isExternal = (href) => /^https?:\/\//.test(href);
const linkAttrs = (href) => (isExternal(href) ? ' rel="noopener"' : '');

function write(path, content) {
  const full = join(OUT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

/* ---------- tiny markdown ---------- */

function inline(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

function markdown(src) {
  const lines = src.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  const startsBlock = (l) => /^(```|#{2,3}\s|\s*[-*]\s|\s*\d+\.\s|>)/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (/^```/.test(l)) {
      const lang = l.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code${lang ? ` class="language-${esc(lang)}"` : ''}>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    const h = l.match(/^(#{2,3})\s+(.*)/);
    if (h) {
      const n = h[1].length;
      out.push(`<h${n} id="${slugify(h[2])}">${inline(h[2])}</h${n}>`);
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(l)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      out.push('<ul>' + items.map((t) => `<li>${inline(t)}</li>`).join('') + '</ul>');
      continue;
    }
    if (/^\s*\d+\.\s+/.test(l)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ''));
      out.push('<ol>' + items.map((t) => `<li>${inline(t)}</li>`).join('') + '</ol>');
      continue;
    }
    if (/^>\s?/.test(l)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote><p>${inline(buf.join(' '))}</p></blockquote>`);
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) buf.push(lines[i++]);
    if (!buf.length) { buf.push(lines[i++]); }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

/* ---------- posts ---------- */

function loadPosts() {
  const dir = join(SRC, 'posts');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(join(dir, file), 'utf8').replace(/\r/g, '');
      const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!m) throw new Error(`Post ${file} is missing front matter`);
      const meta = {};
      m[1].split('\n').forEach((line) => {
        const k = line.indexOf(':');
        if (k > 0) meta[line.slice(0, k).trim()] = line.slice(k + 1).trim();
      });
      for (const key of ['title', 'date', 'description']) {
        if (!meta[key]) throw new Error(`Post ${file} is missing "${key}"`);
      }
      const body = m[2].trim();
      const words = body.split(/\s+/).length;
      return {
        slug: file.replace(/\.md$/, ''),
        title: meta.title,
        date: meta.date,
        description: meta.description,
        tags: (meta.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
        draft: meta.draft === 'true',
        minutes: Math.max(1, Math.round(words / 200)),
        html: markdown(body),
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
const posts = loadPosts();

/* ---------- layout ---------- */

const NAV = [
  ['Home', '/'],
  ['Skills', '/skills/'],
  ['Apps', '/apps/'],
  ['Projects', '/projects/'],
  ['Blog', '/blog/'],
  ['Contact', '/contact/'],
];

const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';

function layout({ title, description, path, body, type = 'website', jsonld, noindex = false }) {
  const url = SITE + path;
  const fullTitle = path === '/' ? title : `${title} | ${site.name}`;
  const ld = jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : '';
  const navHtml = NAV.map(([label, href]) => {
    const current = href === '/' ? path === '/' : path.startsWith(href);
    return `<li><a href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a></li>`;
  }).join('');
  const mobileNavHtml = NAV.map(([label, href]) => {
    const current = href === '/' ? path === '/' : path.startsWith(href);
    return `<li><a href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a></li>`;
  }).join('');

  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta name="color-scheme" content="light dark">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)} blog" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/assets/style.css">
<script>
  document.documentElement.className = 'js';
  try {
    var storedScheme = localStorage.getItem('color-scheme');
    if (storedScheme) {
      document.documentElement.setAttribute('data-theme', storedScheme);
      var metaScheme = document.querySelector('meta[name="color-scheme"]');
      if (metaScheme) metaScheme.content = storedScheme;
    }
  } catch (e) {}
</script>
${ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="${esc(site.name)} - Home">
      <span class="brand-badge" aria-hidden="true">RM</span>
      <span>${esc(site.name)}</span>
    </a>
    <nav aria-label="Main Navigation">
      <ul class="nav">${navHtml}</ul>
    </nav>
    <div class="header-controls">
      <button type="button" class="theme-btn" id="theme-toggle" aria-label="Toggle light or dark theme" title="Toggle theme">
        <svg class="icon-sun" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14l-1.41 1.41"/></svg>
        <svg class="icon-moon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
      </button>
      <button type="button" class="mobile-nav-toggle" id="mobile-nav-toggle" aria-label="Open mobile menu" aria-expanded="false" aria-controls="mobile-drawer">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
</header>

<div class="mobile-drawer" id="mobile-drawer" aria-hidden="true">
  <div class="mobile-drawer-content">
    <ul class="mobile-nav-list">${mobileNavHtml}</ul>
  </div>
</div>

<main id="main">
${body}
</main>

<footer class="site-footer">
  <div class="wrap">
    <p>&copy; ${new Date().getFullYear()} ${esc(site.name)}. Built with modern HTML, CSS and JavaScript.</p>
    <ul>
      <li><a href="${site.github}" rel="noopener">GitHub</a></li>
      <li><a href="${site.linkedin}" rel="noopener">LinkedIn</a></li>
      <li><a href="mailto:${site.email}">Email</a></li>
      <li><a href="/privacy/">Privacy</a></li>
      <li><a href="/feed.xml">RSS</a></li>
    </ul>
  </div>
</footer>

<div class="toast-container" id="toast-alert" role="status" aria-live="polite">
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10b981" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
  <span class="toast-text">Copied to clipboard!</span>
</div>

<button type="button" class="back-to-top" id="back-to-top" aria-label="Back to top">
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>
</button>

<script src="/assets/main.js" defer></script>
</body>
</html>
`;
}

/* ---------- components ---------- */

const tagList = (items) => `<ul class="tags">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

function flipCard(p, id) {
  const links = (p.links || [])
    .map((l) => `<a class="btn-ghost" href="${l.href}"${linkAttrs(l.href)}>${esc(l.label)}</a>`)
    .join('');
  const previewTags = (p.stack || []).slice(0, 3);
  return `<article class="flip" data-flipped="false" tabindex="0" role="region" aria-label="${esc(p.name)} flashcard">
  <div class="flip-inner">
    <div class="face front">
      <div class="face-header">
        <span class="card-phase-badge badge-problem"><span class="badge-dot"></span> The Challenge</span>
        <span class="flip-hint-badge">
          <svg class="flip-icon" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          <span>Hover to flip</span>
        </span>
      </div>
      <h3>${esc(p.name)}</h3>
      <p class="card-problem-text">${esc(p.problem)}</p>
      ${previewTags.length ? `<div class="card-stack-preview"><span class="stack-preview-label">Stack:</span> ${tagList(previewTags)}</div>` : ''}
      <div class="face-actions">
        <div class="flip-cta-pill">
          <span>Reveal architecture &amp; solution</span>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </div>
      </div>
    </div>
    <div class="face back" id="${id}">
      <div class="face-header">
        <span class="card-phase-badge badge-solution"><span class="badge-dot"></span> Solution &amp; Impact</span>
        <span class="flip-hint-badge solution-badge">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          <span>Solved</span>
        </span>
      </div>
      <h3>${esc(p.name)}</h3>
      <p class="card-solution-text">${esc(p.solution)}</p>
      ${p.outcome ? `<div class="outcome-box">
        <div class="outcome-icon" aria-hidden="true"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
        <div class="outcome-details"><strong>Impact</strong><span>${esc(p.outcome)}</span></div>
      </div>` : ''}
      <div class="back-stack-wrap">
        ${tagList(p.stack)}
      </div>
      <div class="face-actions back-actions">
        ${links}
        <button type="button" class="btn-link flip-back-btn" data-flip aria-label="Flip back to problem">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          <span>Flip back</span>
        </button>
      </div>
    </div>
  </div>
</article>`;
}

function appArt() {
  return `<div class="app-art-wrap">
  <svg class="app-art" viewBox="0 0 220 260" role="img" aria-label="Illustration of Foliant reader book and study flashcard">
    <defs>
      <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="glowCard" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>
    </defs>
    <!-- Book reader shell -->
    <rect x="14" y="14" width="162" height="212" rx="14" fill="url(#bookGrad)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
    <!-- Top toolbar pill -->
    <rect x="30" y="32" width="56" height="8" rx="4" fill="#6366f1"/>
    <circle cx="152" cy="36" r="4" fill="#f59e0b"/>
    <!-- Page text rows -->
    <rect x="30" y="58" width="130" height="7" rx="3.5" fill="rgba(255,255,255,0.2)"/>
    <rect x="30" y="74" width="118" height="14" rx="4" fill="rgba(245, 158, 11, 0.25)"/>
    <rect x="30" y="77" width="118" height="8" rx="4" fill="#f59e0b"/>
    <rect x="30" y="98" width="130" height="7" rx="3.5" fill="rgba(255,255,255,0.2)"/>
    <rect x="30" y="114" width="100" height="7" rx="3.5" fill="rgba(255,255,255,0.2)"/>
    <rect x="30" y="130" width="124" height="7" rx="3.5" fill="rgba(255,255,255,0.2)"/>
    <!-- Flashcard overlay -->
    <rect x="68" y="152" width="138" height="92" rx="12" fill="#0f172a" stroke="url(#glowCard)" stroke-width="2"/>
    <rect x="68" y="152" width="138" height="8" rx="4" fill="url(#glowCard)"/>
    <rect x="84" y="174" width="106" height="8" rx="4" fill="#ffffff" opacity="0.9"/>
    <rect x="84" y="192" width="78" height="7" rx="3.5" fill="#10b981"/>
    <circle cx="186" cy="222" r="7" fill="#6366f1"/>
  </svg>
</div>`;
}

function appCard(a, featured) {
  const hasLive = a.links.web || a.links.android;
  return `<article class="card feature">
  <div class="app-feature">
    <div>
      <div class="status">
        <span class="pulse-dot"></span>
        <span>${esc(a.status)}</span>
      </div>
      <h${featured ? 2 : 3}>${esc(a.name)}</h${featured ? 2 : 3}>
      <p class="lede" style="font-size: 1.15rem; margin-bottom: 0.75rem;">${esc(a.tagline)}</p>
      <p class="muted">${esc(a.summary)}</p>
      <div class="actions">
        <a class="btn" href="/apps/${a.slug}/">${hasLive ? 'Explore the app' : 'Learn more'}</a>
        ${a.links.github ? `<a class="btn-ghost" href="${a.links.github}" rel="noopener">Source on GitHub</a>` : ''}
      </div>
    </div>
    ${appArt()}
  </div>
</article>`;
}

const notifyHref = `mailto:${site.email}?subject=${encodeURIComponent('Tell me when your next app ships')}`;

function comingSoonCard() {
  return `<article class="card">
  <h3>More apps are on the way</h3>
  <p class="muted">New engineering tools and productivity readers are currently in development. Send a short email and I will let you know when the next one is ready.</p>
  <div class="actions">
    <a class="btn-ghost" href="${notifyHref}">Get notified by email</a>
  </div>
</article>`;
}

function postItem(p) {
  return `<li>
  <h3><a href="/blog/${p.slug}/">${esc(p.title)}</a></h3>
  <p class="meta">
    <span>${fmtDate(p.date)}</span>
    <span>&middot;</span>
    <span>${p.minutes} min read</span>
  </p>
  <p class="muted">${esc(p.description)}</p>
  ${tagList(p.tags)}
</li>`;
}

const pageHead = (title, lede, crumbs = '') => `<section class="page-head">
  <div class="wrap">
    ${crumbs}
    <h1>${esc(title)}</h1>
    ${lede ? `<p class="lede">${esc(lede)}</p>` : ''}
  </div>
</section>`;

/* ---------- pages ---------- */

const urls = []; // for the sitemap
function page(path, opts, lastmod) {
  const file = path === '/' ? 'index.html' : join(path.replace(/^\//, ''), 'index.html');
  write(file, layout({ ...opts, path }));
  urls.push({ path, lastmod: lastmod || BUILD_DATE });
}

// Home
{
  const hero = projects[0];
  const selected = projects.filter((p) => p.slug !== 'anki-interview-deck' && p.slug !== hero.slug);
  const featuredApp = apps[0];
  const stackGlance = skills
    .slice(0, 6)
    .map(
      (g) => `<div class="glance-item"><h3>${esc(g.group)}</h3><p>${g.items.slice(0, 3).map((i) => esc(i.name)).join(', ')}</p></div>`
    )
    .join('');

  const metricCards = site.trackRecord
    .map(
      (m) => `<div class="metric-card">
        <div class="metric-figure">${esc(m.figure)}</div>
        <p class="metric-text">${esc(m.text)}</p>
      </div>`
    )
    .join('');

  const body = `
<div class="hero-glow-bg" aria-hidden="true"></div>

<section class="hero">
  <div class="wrap">
    <div>
      <div class="status-pill">
        <span class="pulse-dot"></span>
        <span>${esc(site.availability)} &middot; ${esc(site.location)}</span>
      </div>
      <h1>Engineering high-scale <span class="gradient-text">.NET, React & Azure</span> cloud systems.</h1>
      <p class="lede">${esc(site.headline)}</p>
      <div class="actions">
        <a class="btn" href="/skills/">Explore my skills</a>
        <a class="btn-ghost" href="/projects/">View projects</a>
        <button type="button" class="btn-ghost copy-email-btn" data-copy="${site.email}">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
          <span>Copy email</span>
        </button>
      </div>
      <div class="hero-socials">
        <a class="social-pill" href="${site.github}" rel="noopener">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          <span>GitHub</span>
        </a>
        <a class="social-pill" href="${site.linkedin}" rel="noopener">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          <span>LinkedIn</span>
        </a>
        <a class="social-pill" href="mailto:${site.email}">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          <span>Email</span>
        </a>
      </div>
    </div>
    <div class="hero-card">
      ${flipCard(hero, 'hero-flip')}
      <p class="hero-hint">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
        <span>Interactive flashcard: hover or tap to flip and inspect the solution</span>
      </p>
    </div>
  </div>
</section>

<section style="padding-top: 0;">
  <div class="wrap">
    <div class="metrics-strip">
      ${metricCards}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Apps I am building</h2>
      <p>Focused, offline-first tools engineered with modern web and mobile standards.</p>
    </div>
    <div class="grid grid-2">
      ${appCard(featuredApp, false)}
      ${comingSoonCard()}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Selected work & architecture</h2>
      <p>From mission-critical healthcare retail platforms to GenAI tools. Flip a card for the engineering solution.</p>
    </div>
    <div class="grid grid-3">
      ${selected.map((p, i) => flipCard(p, `home-flip-${i}`)).join('\n')}
    </div>
    <div class="actions"><a class="btn-ghost" href="/projects/">View all projects</a></div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Core technologies</h2>
      <p>Technologies used in production across healthcare platforms, cloud migrations, and developer tooling.</p>
    </div>
    <div class="glance">${stackGlance}</div>
    <div class="actions"><a class="btn-ghost" href="/skills/">See detailed skills & experience</a></div>
  </div>
</section>

${posts.length ? `<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Articles & engineering notes</h2>
      <p>Practical write-ups on .NET, React, Azure migrations, and offline architectures.</p>
    </div>
    <ul class="post-list">${posts.slice(0, 3).map(postItem).join('')}</ul>
    <div class="actions"><a class="btn-ghost" href="/blog/">Read all posts</a></div>
  </div>
</section>` : ''}

<section>
  <div class="wrap">
    <div class="card" style="border-top: 4px solid var(--primary-light);">
      <h2>Hiring, or have an engineering challenge?</h2>
      <p class="muted">${esc(site.availability)}. The quickest way to connect is email or LinkedIn message.</p>
      <div class="actions">
        <a class="btn" href="mailto:${site.email}">Email me directly</a>
        <button type="button" class="btn-ghost copy-email-btn" data-copy="${site.email}">Copy email address</button>
        <a class="btn-ghost" href="${site.linkedin}" rel="noopener">Connect on LinkedIn</a>
      </div>
    </div>
  </div>
</section>`;

  page(
    '/',
    {
      title: `${site.name} | ${site.role}`,
      description: site.description,
      body,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: site.name,
        url: SITE,
        jobTitle: site.role,
        email: `mailto:${site.email}`,
        address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressRegion: 'Karnataka', addressCountry: 'IN' },
        alumniOf: 'R.V.R. & J.C. College of Engineering',
        knowsAbout: ['ASP.NET Core', 'C#', 'React', 'SQL Server', 'Microsoft Azure', 'Progressive Web Apps'],
        sameAs: [site.github, site.linkedin],
      },
    }
  );
}

// Skills
{
  const record = site.trackRecord.map((r) => `<div class="metric-card"><div class="metric-figure">${esc(r.figure)}</div><p class="metric-text">${esc(r.text)}</p></div>`).join('');

  function mapCategory(groupName) {
    const g = groupName.toLowerCase();
    if (g.includes('backend') || g.includes('api')) return 'backend';
    if (g.includes('frontend')) return 'frontend';
    if (g.includes('cloud') || g.includes('devops')) return 'cloud';
    if (g.includes('database')) return 'databases';
    if (g.includes('security') || g.includes('identity')) return 'security';
    if (g.includes('delivery') || g.includes('practice')) return 'delivery';
    if (g.includes('ai') || g.includes('generative')) return 'ai';
    return 'other';
  }

  const groups = skills
    .map(
      (g) => `<div class="skill-group" data-category="${mapCategory(g.group)}">
        <h3>${esc(g.group)}</h3>
        <ul class="skills">${g.items
          .map((i) => `<li><strong>${esc(i.name)}</strong><span>${esc(i.context)}</span></li>`)
          .join('')}</ul>
      </div>`
    )
    .join('');

  const exp = site.experience
    .map(
      (e) => `<li>
  <h3>${esc(e.role)}, ${esc(e.where)}</h3>
  <p class="when">${esc(e.when)} &middot; ${esc(e.place)}</p>
  <ul>${e.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
</li>`
    )
    .join('');

  const initiatives = site.initiatives
    .map((i) => `<div class="card"><h3>${esc(i.name)}</h3><p class="muted">${esc(i.text)}</p></div>`)
    .join('');

  const certs = site.certifications
    .map((c) => `<li><strong>${esc(c.name)}</strong><span>${esc(c.by)}${c.when ? ' &middot; ' + esc(c.when) : ''}</span></li>`)
    .join('');

  const body = `
${pageHead('Skills and experience', `${site.role} in Bengaluru with 4+ years of enterprise delivery. ${site.availability}.`)}

<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Track record at a glance</h2>
      <p>Measurable engineering outcomes delivered in enterprise healthcare environments.</p>
    </div>
    <div class="metrics-strip">${record}</div>
    <div class="actions no-print">
      <a class="btn" href="mailto:${site.email}?subject=${encodeURIComponent('Resume request')}">Request resume by email</a>
      <a class="btn-ghost" href="${site.linkedin}" rel="noopener">LinkedIn profile</a>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Technical competencies</h2>
      <p>Filter by domain or view all. Each skill is grounded in concrete production delivery.</p>
    </div>
    <div class="skills-filter-bar no-print">
      <button type="button" class="filter-tab active" data-skill-filter="all">All Skills</button>
      <button type="button" class="filter-tab" data-skill-filter="backend">Backend & APIs</button>
      <button type="button" class="filter-tab" data-skill-filter="frontend">Frontend</button>
      <button type="button" class="filter-tab" data-skill-filter="cloud">Cloud & DevOps</button>
      <button type="button" class="filter-tab" data-skill-filter="databases">Databases</button>
      <button type="button" class="filter-tab" data-skill-filter="security">Security & Identity</button>
      <button type="button" class="filter-tab" data-skill-filter="delivery">Delivery & SRE</button>
      <button type="button" class="filter-tab" data-skill-filter="ai">Generative AI</button>
    </div>
    <div class="skill-grid">${groups}</div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Career timeline</h2>
      <p>Enterprise and full-stack software engineering journey.</p>
    </div>
    <ol class="timeline">${exp}</ol>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Engineering initiatives</h2>
      <p>High-impact prototypes, automation tooling, and architectural studies.</p>
    </div>
    <div class="grid grid-3">${initiatives}</div>
  </div>
</section>

<section>
  <div class="wrap grid grid-2">
    <div class="card">
      <h2>Education</h2>
      <p><strong>${esc(site.education.degree)}</strong><br>${esc(site.education.school)}<br><span class="muted">${esc(site.education.when)}</span></p>
      <p class="muted">${esc(site.education.foundations)}</p>
    </div>
    <div class="card">
      <h2>Certifications & training</h2>
      <ul class="cert-list">${certs}</ul>
    </div>
  </div>
</section>

<section class="no-print">
  <div class="wrap"><p class="muted">Tip: use your browser's Print command (<kbd>Ctrl+P</kbd> or <kbd>Cmd+P</kbd>) on this page to cleanly save it as a PDF resume.</p></div>
</section>`;

  page('/skills/', {
    title: 'Skills and experience',
    description: `Skills and experience of ${site.name}: ASP.NET Core, C#, React, SQL Server, Azure and generative AI, each tied to real work.`,
    body,
  });
}

// Apps
{
  const body = `
${pageHead('Apps', 'Focused, offline-first tools I build and maintain. Each app has its own dedicated page, source repository, and privacy guarantee.')}
<section>
  <div class="wrap">
    <div class="grid grid-2">
      ${apps.map((a) => appCard(a, false)).join('\n')}
      ${comingSoonCard()}
    </div>
  </div>
</section>`;
  page('/apps/', {
    title: 'Apps',
    description: `Apps by ${site.name}, starting with Foliant, an offline-first reader that turns any PDF into an interactive book.`,
    body,
  });

  for (const a of apps) {
    const open = [];
    if (a.links.web) open.push(`<a class="btn" href="${a.links.web}" rel="noopener">Open web app</a>`);
    if (a.links.android) open.push(`<a class="btn" href="${a.links.android}" rel="noopener">Get Android app</a>`);
    if (a.links.github) open.push(`<a class="${open.length ? 'btn-ghost' : 'btn'}" href="${a.links.github}" rel="noopener">View source on GitHub</a>`);
    open.push(`<a class="btn-ghost" href="mailto:${site.email}?subject=${encodeURIComponent(a.name + ' support')}">Email support</a>`);
    const body = `
<section class="page-head">
  <div class="wrap">
    <p class="crumbs"><a href="/apps/">Apps</a> / ${esc(a.name)}</p>
    <div class="app-feature">
      <div>
        <div class="status">
          <span class="pulse-dot"></span>
          <span>${esc(a.status)}</span>
        </div>
        <h1>${esc(a.name)}</h1>
        <p class="lede">${esc(a.tagline)}</p>
        <div class="actions">${open.join('')}</div>
      </div>
      ${appArt()}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Key capabilities</h2>
      <p>${esc(a.summary)}</p>
    </div>
    <div class="grid grid-3">
      ${a.features.map((f) => `<div class="card"><h3>${esc(f.name)}</h3><p class="muted">${esc(f.text)}</p></div>`).join('')}
    </div>
  </div>
</section>

<section>
  <div class="wrap grid grid-2">
    <div class="card">
      <h2>Built with</h2>
      ${tagList(a.stack)}
    </div>
    <div class="card">
      <h2>Privacy & data storage</h2>
      <p>${a.privacy.collectsData ? 'See the privacy policy for what this app collects and why.' : `<strong>${esc(a.name)} collects zero personal data.</strong> Your files and reading metadata are stored ${esc(a.privacy.storage)}.`}</p>
      <div class="actions">
        <a class="btn-link" href="/privacy/${a.slug}/">Read full privacy policy &rarr;</a>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="card" style="border-top: 4px solid var(--primary-light);">
      <h2>Feedback & suggestions</h2>
      <p class="muted">Encountered an issue or have a feature idea? Email <a href="mailto:${site.email}?subject=${encodeURIComponent(a.name + ' feedback')}">${esc(site.email)}</a>${a.links.github ? ` or open an issue on <a href="${a.links.github}" rel="noopener">GitHub</a>` : ''}.</p>
    </div>
  </div>
</section>`;

    page(`/apps/${a.slug}/`, {
      title: `${a.name}: ${a.tagline.replace(/\.$/, '')}`,
      description: a.summary,
      body,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: a.name,
        description: a.summary,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web, Android',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@type': 'Person', name: site.name, url: SITE },
      },
    });
  }
}

// Projects
{
  const body = `
${pageHead('Projects & Architecture', 'Each project card presents the production challenge first. Flip the card to inspect the architecture and results.')}
<section>
  <div class="wrap">
    <div class="grid grid-2">
      ${projects.map((p, i) => flipCard(p, `project-flip-${i}`)).join('\n')}
    </div>
  </div>
</section>`;
  page('/projects/', {
    title: 'Projects',
    description: `Projects by ${site.name}: Foliant, a GenAI knowledge dashboard, enterprise healthcare retail modules and a .NET interview Anki deck.`,
    body,
  });
}

// Anki Deck Landing Page (Shareable Product Page)
{
  const subdecks = [
    { code: '00', name: 'C#', desc: 'Core language features, memory, CLR, collections, generics, and modern C# features' },
    { code: '01', name: 'Object-Oriented Programming', desc: 'Encapsulation, inheritance, polymorphism, abstraction, and SOLID principles' },
    { code: '02', name: 'ASP.NET Core', desc: 'Middleware pipeline, dependency injection, hosting lifecycle, filters, and configuration' },
    { code: '03', name: 'ASP.NET Core Web API', desc: 'REST architecture, routing, model binding, versioning, and status codes' },
    { code: '04', name: 'Entity Framework Core', desc: 'LINQ, change tracking, migrations, query optimization, and execution plans' },
    { code: '05', name: 'SQL Server', desc: 'Indexes, query plans, ACID transactions, locking, isolation levels, and T-SQL tuning' },
    { code: '06', name: 'Design Patterns', desc: 'Repository, Unit of Work, Factory, Singleton, Strategy, and CQRS patterns' },
    { code: '07', name: 'Authentication & Security', desc: 'JWT tokens, OAuth2, OpenID Connect, cookies, CORS, and vulnerability defense' },
    { code: '08', name: 'Azure Cloud', desc: 'App Services, Azure Functions, Blob Storage, SQL Database, Key Vault, and Entra ID' },
    { code: '09', name: 'React Fundamentals', desc: 'Component lifecycle, hooks (useState, useEffect, useMemo, useCallback), and virtual DOM' },
    { code: '10', name: 'Scenario-Based Questions', desc: 'Production incident triage, debugging memory leaks, and high-load bottlenecks' },
    { code: '11', name: 'Project-Based Questions', desc: 'Enterprise architecture walkthroughs, system trade-offs, and design justifications' },
    { code: '12', name: 'Advanced React', desc: 'State management, custom hooks, performance profiling, and SSR architecture' },
    { code: '13', name: 'Docker & Kubernetes', desc: 'Containerization, pod lifecycle, deployments, and cluster management' },
    { code: '13', name: 'Microservices Architecture', desc: 'API gateways, event-driven design, service discovery, and resilient messaging' },
  ];

  const subdeckCards = subdecks.map((s) => `
    <div class="card" style="padding: 1.35rem 1.5rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.35rem;">
        <span class="tags" style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--primary-light);">[${esc(s.code)}]</span>
        <span style="font-size: 0.78rem; font-weight: 700; color: var(--accent-amber); text-transform: uppercase; letter-spacing: 0.05em;">Subdeck</span>
      </div>
      <h3 style="font-size: 1.2rem; margin-bottom: 0.3rem;">${esc(s.name)}</h3>
      <p class="muted" style="font-size: 0.92rem; margin: 0; line-height: 1.5;">${esc(s.desc)}</p>
    </div>
  `).join('');

  const body = `
<section class="page-head">
  <div class="wrap">
    <div class="status-pill">
      <span class="pulse-dot"></span>
      <span>390+ Cards &middot; Mobile-Optimized &middot; Free &amp; Pro Available</span>
    </div>
    <h1 style="max-width: 48rem;">101 Preparation: <span class="gradient-text">Full-Stack .NET + React + Azure</span> Interview Deck</h1>
    <p class="lede" style="max-width: 44rem;">A mobile-optimized Anki flashcard deck covering the complete full-stack enterprise stack — built and refined from real engineering interview loops, reformatted for clean, scannable review on your phone.</p>
    
    <div class="actions" style="margin-top: 2rem;">
      <a class="btn" href="https://esh246.gumroad.com/l/101prep-pro" rel="noopener" target="_blank" style="background: linear-gradient(135deg, var(--accent-amber), #ea580c); border: none; color: #ffffff;">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
        <span>Get the Pro Version (₹99 on Gumroad)</span>
      </a>
      <a class="btn-ghost" href="https://ankiweb.net/shared/info/101042386" rel="noopener" target="_blank">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        <span>Download Free on AnkiWeb</span>
      </a>
      <a class="btn-ghost" href="https://github.com/Ramesh240/101-preparation-anki-deck" rel="noopener" target="_blank">
        <span>GitHub Repository</span>
      </a>
      <a class="btn-ghost" href="https://buymeacoffee.com/ramesh.dev" rel="noopener" target="_blank">
        <span>☕ Buy Me a Coffee</span>
      </a>
    </div>
  </div>
</section>

<!-- Pro Version Highlight Banner -->
<section style="padding-top: 1.5rem; padding-bottom: 2rem;">
  <div class="wrap">
    <div class="card" style="border: 2px solid var(--accent-amber); background: linear-gradient(135deg, var(--bg-surface-elevated), var(--accent-amber-subtle)); padding: 2.2rem; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.15);">
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1.5rem;">
        <div style="max-width: 44rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.75rem; border-radius: var(--radius-full); background: var(--accent-amber); color: #000000; font-weight: 800; font-size: 0.8rem; margin-bottom: 0.75rem;">
            PRO EDITION
          </div>
          <h2 style="font-size: 1.85rem; margin-bottom: 0.5rem;">Upgrade to 101 Preparation Pro (₹99 One-Time)</h2>
          <p style="margin: 0; color: var(--text-muted); font-size: 1.05rem; line-height: 1.6;">
            Includes <strong>STAR-formatted, experience-based project &amp; behavioral questions</strong> plus the <strong>full mobile card styling (Front &amp; Back templates + CSS)</strong> used to build this deck. Instant digital download.
          </p>
        </div>
        <div style="flex-shrink: 0;">
          <a class="btn" href="https://esh246.gumroad.com/l/101prep-pro" rel="noopener" target="_blank" style="padding: 0.95rem 1.8rem; font-size: 1.05rem; background: var(--accent-amber); color: #000000; font-weight: 700; border: none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
            <span>Get Pro for ₹99 &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Features Grid -->
<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Engineered for real mobile review</h2>
      <p>Designed specifically to solve what's broken with default Anki card templates on smartphones.</p>
    </div>
    <div class="grid grid-3">
      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.3rem;">📱</span> Mobile-First Card Design
        </h3>
        <p class="muted">Centered question with a topic badge and fully scrollable answers. No more clipped, cut-off cards on small phone screens.</p>
      </div>
      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.3rem;">🌙</span> Dark Mode Optimized
        </h3>
        <p class="muted">Follows your phone or desktop's Anki night mode automatically with carefully tuned contrast for late-night review sessions.</p>
      </div>
      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.3rem;">💻</span> Clean Code Formatting
        </h3>
        <p class="muted">C#, SQL, and TypeScript code blocks wrap intelligently instead of forcing painful horizontal scrolling. Comparison tables are fully responsive.</p>
      </div>
      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.3rem;">🗣️</span> "Interview Answer" Formula
        </h3>
        <p class="muted">Every single card follows a consistent structure: a concise definition, real code example, and a 1-line punchy takeaway you can actually say out loud.</p>
      </div>
      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.3rem;">🗂️</span> 13 Topic-Based Subdecks
        </h3>
        <p class="muted">Organized into 13 modular subdecks so you can drill deep into a weak topic or shuffle them all together for mock interview simulations.</p>
      </div>
      <div class="card">
        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.3rem;">⚡</span> Spaced Repetition Supercharged
        </h3>
        <p class="muted">Built directly for Anki's proven spaced repetition algorithm so you retain complex distributed systems and runtime concepts forever.</p>
      </div>
    </div>
  </div>
</section>

<!-- Subdeck Catalog -->
<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Subdeck breakdown (390+ Cards)</h2>
      <p>Everything required for senior and mid-level full-stack engineering interviews in .NET, React, and Azure ecosystems.</p>
    </div>
    <div class="grid grid-3">
      ${subdeckCards}
    </div>
  </div>
</section>

<!-- Installation & Quick Start -->
<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Installation guide (30 seconds)</h2>
      <p>Quick start instructions for Desktop, AnkiDroid, and AnkiMobile.</p>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <ol style="margin: 0; padding-left: 1.25rem; line-height: 1.85; color: var(--text-muted);">
          <li><strong style="color: var(--text-main);">Download:</strong> Get <code>101_Preparation.apkg</code> from <a href="https://ankiweb.net/shared/info/101042386" rel="noopener" target="_blank">AnkiWeb</a> or the <a href="https://github.com/Ramesh240/101-preparation-anki-deck" rel="noopener" target="_blank">GitHub release</a>.</li>
          <li><strong style="color: var(--text-main);">Open Anki:</strong> Launch Anki on Desktop, AnkiDroid (Android), or AnkiMobile (iOS).</li>
          <li><strong style="color: var(--text-main);">Import:</strong> Click <em>File &rarr; Import</em> (or tap the downloaded file directly on mobile).</li>
          <li><strong style="color: var(--text-main);">Ready:</strong> All 13 subdecks are automatically generated under the <em>101 Preparation</em> root deck!</li>
        </ol>
      </div>
      <div class="card" style="display: flex; flex-direction: column; justify-content: center; gap: 1rem;">
        <h3>Open source &amp; Community backed</h3>
        <p class="muted" style="margin: 0;">Found an outdated answer, error, or want to suggest a new interview scenario? Contributions are welcome via GitHub pull requests.</p>
        <div class="actions" style="margin-top: 0.5rem;">
          <a class="btn-ghost" href="https://github.com/Ramesh240/101-preparation-anki-deck" rel="noopener" target="_blank">GitHub Repository</a>
          <a class="btn-ghost" href="https://buymeacoffee.com/ramesh.dev" rel="noopener" target="_blank">☕ Buy Me a Coffee</a>
        </div>
      </div>
    </div>
  </div>
</section>
`;

  page('/anki/', {
    title: '101 Preparation: Full-Stack .NET + React + Azure Anki Deck',
    description: 'A mobile-optimized Anki flashcard deck with 390+ cards for interview prep covering C#, ASP.NET Core, EF Core, SQL Server, Azure, React, and system design.',
    body,
  });

  page('/101-prep/', {
    title: '101 Preparation: Full-Stack .NET + React + Azure Anki Deck',
    description: 'A mobile-optimized Anki flashcard deck with 390+ cards for interview prep covering C#, ASP.NET Core, EF Core, SQL Server, Azure, React, and system design.',
    body,
  });
}

// Blog
{
  const body = `
${pageHead('Blog', 'Engineering write-ups, architecture notes, and lessons from building scalable .NET, React, and offline applications.')}
<section>
  <div class="wrap">
    ${posts.length ? `<ul class="post-list">${posts.map(postItem).join('')}</ul>` : '<p>Posts are coming soon.</p>'}
    <p class="meta" style="margin-top: 2rem;"><a href="/feed.xml">Subscribe with RSS</a></p>
  </div>
</section>`;
  page('/blog/', {
    title: 'Blog',
    description: `Articles by ${site.name} on .NET, React, Azure, PWAs and learning.`,
    body,
  });

  for (const p of posts) {
    const body = `
<section class="page-head">
  <div class="wrap">
    <p class="crumbs"><a href="/blog/">Blog</a> / ${esc(p.title)}</p>
    <h1>${esc(p.title)}</h1>
    <p class="meta">
      <span>${fmtDate(p.date)}</span>
      <span>&middot;</span>
      <span>${p.minutes} min read</span>
      <span>&middot;</span>
      <span>by ${esc(site.name)}</span>
    </p>
    ${tagList(p.tags)}
  </div>
</section>
<section>
  <div class="wrap">
    <article class="prose">
${p.html}
    </article>
    <div class="actions" style="margin-top: 3rem;">
      <a class="btn" href="/blog/">&larr; Back to all posts</a>
      <a class="btn-ghost" href="mailto:${site.email}?subject=${encodeURIComponent('Re: ' + p.title)}">Reply by email</a>
    </div>
  </div>
</section>`;

    page(
      `/blog/${p.slug}/`,
      {
        title: p.title,
        description: p.description,
        type: 'article',
        body,
        jsonld: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: p.title,
          description: p.description,
          datePublished: p.date,
          dateModified: p.date,
          mainEntityOfPage: `${SITE}/blog/${p.slug}/`,
          author: { '@type': 'Person', name: site.name, url: SITE },
        },
      },
      p.date
    );
  }
}

// Privacy
{
  const siteBody = `
${pageHead('Privacy policy', 'Clear, transparent explanation of what this website does and does not do with your information.')}
<section>
  <div class="wrap">
    <div class="prose legal">
      <p class="meta">Last updated ${fmtDate(BUILD_DATE)}</p>
      <h2>The short version</h2>
      <p>This website does not use cookies, tracking analytics, advertising or marketing scripts, and has no accounts or databases. I do not collect or monetize personal information through it.</p>
      <h2>Hosting & technical logs</h2>
      <p>The site is hosted on GitHub Pages. Like any web host, GitHub may log technical information such as your IP address and the pages requested when your browser retrieves assets. I do not store or process that information. See <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">GitHub's privacy statement</a> for details.</p>
      <h2>Fonts & assets</h2>
      <p>Fonts are retrieved from Google Fonts, so your browser connects to Google's CDN when opening a page. Google receives standard HTTP request headers as outlined in their privacy guidelines.</p>
      <h2>Direct email contact</h2>
      <p>Email links on this site trigger your default email client. If you message me at <a href="mailto:${site.email}">${esc(site.email)}</a>, your email address is used solely to reply to you and is never shared.</p>
      <h2>Third-party links</h2>
      <p>This site provides links to GitHub, LinkedIn, and external references. Their respective privacy policies govern those platforms.</p>
      <h2>Application policies</h2>
      <p>Each app maintains its own privacy terms:</p>
      <ul>${apps.map((a) => `<li><a href="/privacy/${a.slug}/">${esc(a.name)} Privacy Policy</a></li>`).join('')}</ul>
      <h2>Contact</h2>
      <p>Questions regarding privacy: <a href="mailto:${site.email}">${esc(site.email)}</a>.</p>
    </div>
  </div>
</section>`;

  page('/privacy/', {
    title: 'Privacy policy',
    description: `Privacy policy for ${site.name}'s website: no cookies, no analytics, no tracking.`,
    body: siteBody,
  }, BUILD_DATE);

  for (const a of apps) {
    const p = a.privacy;
    const customFile = join(SRC, 'privacy', `${a.slug}.md`);
    let content;
    if (existsSync(customFile)) {
      content = markdown(readFileSync(customFile, 'utf8'));
    } else if (!p.collectsData) {
      content = `
<h2>The short version</h2>
<p>${esc(a.name)} does not collect, store on external servers, share, or monetize any personal data. It operates with zero user accounts, zero analytics trackers, and zero third-party advertising SDKs.</p>
<h2>Where your reading data lives</h2>
<p>The documents you open and any bookmarks, highlights, reading progress, and flashcards you create remain stored exclusively ${esc(p.storage)}. Nothing is uploaded to a remote server.</p>
<h2>Network activity</h2>
<p>The application only accesses the network to download its initial assets or check for Progressive Web App updates. None of your files or reading logs are transmitted.</p>
<h2>Deleting your data</h2>
<p>Because everything stays locally on your device, deleting the app or clearing browser site storage instantly wipes all documents and metadata.</p>
<h2>Contact</h2>
<p>Questions regarding this policy: <a href="mailto:${site.email}">${esc(site.email)}</a>.</p>`;
    } else {
      throw new Error(`App "${a.slug}" collects data: add src/privacy/${a.slug}.md with its policy`);
    }

    const body = `
<section class="page-head">
  <div class="wrap">
    <p class="crumbs"><a href="/privacy/">Privacy</a> / ${esc(a.name)}</p>
    <h1>${esc(a.name)} privacy policy</h1>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="prose legal">
      <p class="meta">Last updated ${fmtDate(p.lastUpdated)}</p>
      ${content}
    </div>
  </div>
</section>`;

    page(`/privacy/${a.slug}/`, {
      title: `${a.name} privacy policy`,
      description: `Privacy policy for ${a.name}: how the app handles your data.`,
      body,
    }, p.lastUpdated);
  }
}

// Contact
page('/contact/', {
  title: 'Contact',
  description: `Contact ${site.name} about software engineering roles, collaboration or app feedback.`,
  body: `
${pageHead('Get in Touch', `${site.availability}. Whether discussing full-time opportunities, system architecture, or app feedback, feel free to reach out.`)}

<section>
  <div class="wrap">
    <div class="contact-grid">
      <div class="contact-card">
        <h3>Email</h3>
        <p class="muted">Primary channel for roles and engineering inquiries.</p>
        <div class="actions" style="margin-top: 0.5rem;">
          <a class="btn" href="mailto:${site.email}">Send email</a>
          <button type="button" class="btn-ghost copy-email-btn" data-copy="${site.email}">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
            <span>Copy address</span>
          </button>
        </div>
      </div>

      <div class="contact-card">
        <h3>LinkedIn</h3>
        <p class="muted">Professional profile, background, and recommendations.</p>
        <div class="actions" style="margin-top: 0.5rem;">
          <a class="btn-ghost" href="${site.linkedin}" rel="noopener">Connect on LinkedIn</a>
        </div>
      </div>

      <div class="contact-card">
        <h3>GitHub</h3>
        <p class="muted">Open-source repositories, experiments, and code samples.</p>
        <div class="actions" style="margin-top: 0.5rem;">
          <a class="btn-ghost" href="${site.github}" rel="noopener">View GitHub profile</a>
        </div>
      </div>

      <div class="contact-card">
        <h3>Location & Availability</h3>
        <p class="muted">${esc(site.location)}</p>
        <div class="status" style="margin-top: 0.5rem;">
          <span class="pulse-dot"></span>
          <span>${esc(site.availability)}</span>
        </div>
      </div>
    </div>
  </div>
</section>`,
});

// 404 (not in sitemap)
write('404.html', layout({
  title: 'Page not found',
  description: 'This page does not exist.',
  path: '/404.html',
  noindex: true,
  body: `
${pageHead('Page not found', 'That address does not lead anywhere. Try one of these instead.')}
<section>
  <div class="wrap">
    <div class="actions">
      <a class="btn" href="/">Home</a>
      <a class="btn-ghost" href="/apps/">Apps</a>
      <a class="btn-ghost" href="/skills/">Skills</a>
      <a class="btn-ghost" href="/blog/">Blog</a>
    </div>
  </div>
</section>`,
}));

/* ---------- feeds and static files ---------- */

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u.path}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`);

write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(site.name)}</title>
  <link>${SITE}/blog/</link>
  <description>Notes on .NET, React, Azure, building apps and learning.</description>
  <language>en</language>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
${posts
  .map(
    (p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${SITE}/blog/${p.slug}/</link>
    <guid>${SITE}/blog/${p.slug}/</guid>
    <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
    <description>${esc(p.description)}</description>
  </item>`
  )
  .join('\n')}
</channel>
</rss>
`);

rmSync(join(OUT, 'assets'), { recursive: true, force: true });
cpSync(join(SRC, 'assets'), join(OUT, 'assets'), { recursive: true });
if (existsSync(join(SRC, 'static'))) cpSync(join(SRC, 'static'), OUT, { recursive: true });

console.log(`Built ${urls.length} pages and ${posts.length} posts into dist/`);

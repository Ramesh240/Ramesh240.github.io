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
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&display=swap';

function layout({ title, description, path, body, type = 'website', jsonld, noindex = false }) {
  const url = SITE + path;
  const fullTitle = path === '/' ? title : `${title} | ${site.name}`;
  const ld = jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : '';
  const navHtml = NAV.map(([label, href]) => {
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
<script>document.documentElement.className = 'js';</script>
${ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">${esc(site.name)}</a>
    <nav aria-label="Main"><ul class="nav">${navHtml}</ul></nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p>&copy; ${new Date().getFullYear()} ${esc(site.name)}. Built with plain HTML, CSS and JavaScript.</p>
    <ul>
      <li><a href="${site.github}" rel="noopener">GitHub</a></li>
      <li><a href="${site.linkedin}" rel="noopener">LinkedIn</a></li>
      <li><a href="mailto:${site.email}">Email</a></li>
      <li><a href="/privacy/">Privacy</a></li>
      <li><a href="/feed.xml">RSS</a></li>
    </ul>
  </div>
</footer>
<script src="/assets/main.js" defer></script>
</body>
</html>
`;
}

/* ---------- components ---------- */

const tagList = (items) => `<ul class="tags">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

function flipCard(p, id) {
  const links = (p.links || [])
    .map((l) => `<a href="${l.href}"${linkAttrs(l.href)}>${esc(l.label)}</a>`)
    .join('');
  return `<article class="flip" data-flipped="false">
  <div class="flip-inner">
    <div class="face front">
      <h3>${esc(p.name)}</h3>
      <p class="muted">${esc(p.problem)}</p>
      <div class="face-actions"><button type="button" class="btn-link" data-flip>See how it was solved</button></div>
    </div>
    <div class="face back" id="${id}">
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.solution)}</p>
      ${p.outcome ? `<p class="outcome">${esc(p.outcome)}</p>` : ''}
      ${tagList(p.stack)}
      <div class="face-actions"><button type="button" class="btn-link" data-flip>Back to the problem</button>${links}</div>
    </div>
  </div>
</article>`;
}

function appArt() {
  return `<svg class="app-art" viewBox="0 0 200 240" role="img" aria-label="Illustration of a book page with highlighted text and a flashcard">
  <rect x="14" y="12" width="150" height="196" rx="8" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/>
  <rect x="30" y="34" width="86" height="10" rx="3" fill="var(--ink)"/>
  <rect x="30" y="60" width="118" height="6" rx="3" fill="var(--line)"/>
  <rect x="30" y="76" width="104" height="14" rx="3" fill="var(--marigold)" opacity=".55"/>
  <rect x="30" y="76" width="104" height="6" rx="3" fill="var(--steel)" opacity=".6"/>
  <rect x="30" y="100" width="118" height="6" rx="3" fill="var(--line)"/>
  <rect x="30" y="116" width="90" height="6" rx="3" fill="var(--line)"/>
  <rect x="30" y="132" width="118" height="6" rx="3" fill="var(--line)"/>
  <rect x="64" y="148" width="124" height="78" rx="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>
  <rect x="64" y="148" width="124" height="8" rx="4" fill="var(--marigold)"/>
  <rect x="80" y="172" width="92" height="8" rx="3" fill="var(--ink)"/>
  <rect x="80" y="190" width="64" height="6" rx="3" fill="var(--steel)" opacity=".6"/>
</svg>`;
}

function appCard(a, featured) {
  const hasLive = a.links.web || a.links.android;
  return `<article class="card feature">
  <div class="app-feature">
    <div>
      <h${featured ? 2 : 3}>${esc(a.name)}</h${featured ? 2 : 3}>
      <p class="status">${esc(a.status)}</p>
      <p class="lede">${esc(a.tagline)}</p>
      <p>${esc(a.summary)}</p>
      <div class="actions">
        <a class="btn" href="/apps/${a.slug}/">${hasLive ? 'See the app' : 'Learn more'}</a>
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
  <p class="muted">New apps are in progress. Send a short email and I will let you know when the next one is ready.</p>
  <div class="actions"><a class="btn-ghost" href="${notifyHref}">Get notified by email</a></div>
</article>`;
}

function postItem(p) {
  return `<li>
  <h3><a href="/blog/${p.slug}/">${esc(p.title)}</a></h3>
  <p class="meta">${fmtDate(p.date)} &middot; ${p.minutes} min read</p>
  <p>${esc(p.description)}</p>
  ${tagList(p.tags)}
</li>`;
}

const pageHead = (title, lede, crumbs = '') => `<section class="page-head">
  <div class="wrap">
    ${crumbs}
    <h1>${esc(title)}</h1>
    ${lede ? `<p class="lede muted">${esc(lede)}</p>` : ''}
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
  const selected = projects.slice(1);
  const featuredApp = apps[0];
  const stackGlance = skills
    .slice(0, 6)
    .map((g) => `<div><h3>${esc(g.group)}</h3><p>${g.items.slice(0, 3).map((i) => esc(i.name)).join(', ')}</p></div>`)
    .join('');
  const body = `
<section class="hero">
  <div class="wrap">
    <div>
      <h1>${esc(site.name)}</h1>
      <p class="lede">${esc(site.headline)}</p>
      <div class="actions">
        <a class="btn" href="/skills/">View my skills</a>
        <a class="btn-ghost" href="/apps/">Try my apps</a>
        <a class="btn-ghost" href="mailto:${site.email}">Get in touch</a>
      </div>
    </div>
    <div class="hero-card">
      ${flipCard(hero, 'hero-flip')}
      <p class="hero-hint">Cards on this site flip: the problem first, then how I solved it.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <h2>Apps I am building</h2>
      <p>Small, focused tools I design, build and maintain myself.</p>
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
      <h2>Selected work</h2>
      <p>From enterprise platforms to developer tools. Flip a card for the solution.</p>
    </div>
    <div class="grid grid-3">
      ${selected.map((p, i) => flipCard(p, `home-flip-${i}`)).join('\n')}
    </div>
    <div class="actions"><a class="btn-ghost" href="/projects/">All projects</a></div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <h2>What I work with</h2>
      <p>${esc(site.trackRecord[0].figure)} ${esc(site.trackRecord[0].text)}. The Skills page shows where each technology was used.</p>
    </div>
    <div class="glance">${stackGlance}</div>
    <div class="actions"><a class="btn-ghost" href="/skills/">See skills and experience</a></div>
  </div>
</section>

${posts.length ? `<section>
  <div class="wrap">
    <div class="section-head"><h2>From the blog</h2><p>Notes on .NET, React, Azure and learning.</p></div>
    <ul class="post-list">${posts.slice(0, 3).map(postItem).join('')}</ul>
    <div class="actions"><a class="btn-ghost" href="/blog/">All posts</a></div>
  </div>
</section>` : ''}

<section>
  <div class="wrap">
    <div class="card">
      <h2>Hiring, or have something to build?</h2>
      <p>${esc(site.availability)}. The quickest way to reach me is email.</p>
      <div class="actions">
        <a class="btn" href="mailto:${site.email}">${esc(site.email)}</a>
        <a class="btn-ghost" href="${site.linkedin}" rel="noopener">LinkedIn</a>
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
  const record = site.trackRecord.map((r) => `<li><strong>${esc(r.figure)}</strong><span>${esc(r.text)}</span></li>`).join('');
  const groups = skills
    .map(
      (g) => `<div class="skill-group"><h3>${esc(g.group)}</h3><ul class="skills">${g.items
        .map((i) => `<li><strong>${esc(i.name)}</strong><span>${esc(i.context)}</span></li>`)
        .join('')}</ul></div>`
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
    .map((c) => `<li>${esc(c.name)}<span>${esc(c.by)}${c.when ? ' &middot; ' + esc(c.when) : ''}</span></li>`)
    .join('');
  const body = `
${pageHead('Skills and experience', `${site.role} in Bengaluru with 4+ years of enterprise delivery. ${site.availability}.`)}
<section>
  <div class="wrap">
    <h2>Track record</h2>
    <ul class="record">${record}</ul>
    <div class="actions no-print">
      <a class="btn" href="mailto:${site.email}?subject=${encodeURIComponent('Resume request')}">Request my resume</a>
      <a class="btn-ghost" href="${site.linkedin}" rel="noopener">LinkedIn profile</a>
    </div>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="section-head"><h2>Skills, with where I used them</h2><p>Each skill is tied to real work, not a self-rating.</p></div>
    <div class="skill-grid">${groups}</div>
  </div>
</section>
<section>
  <div class="wrap">
    <h2>Experience</h2>
    <ol class="timeline">${exp}</ol>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="section-head"><h2>Initiatives</h2><p>Work beyond the day-to-day brief.</p></div>
    <div class="grid grid-3">${initiatives}</div>
  </div>
</section>
<section>
  <div class="wrap grid grid-2">
    <div>
      <h2>Education</h2>
      <p><strong>${esc(site.education.degree)}</strong><br>${esc(site.education.school)}<br><span class="muted">${esc(site.education.when)}</span></p>
      <p class="muted">${esc(site.education.foundations)}</p>
    </div>
    <div>
      <h2>Certifications</h2>
      <ul class="cert-list">${certs}</ul>
    </div>
  </div>
</section>
<section class="no-print">
  <div class="wrap"><p class="muted">Tip: use your browser's print command on this page to save it as a PDF resume.</p></div>
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
${pageHead('Apps', 'Free, focused tools I build and maintain. Each one has its own page, source and privacy policy.')}
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
    if (a.links.web) open.push(`<a class="btn" href="${a.links.web}" rel="noopener">Open the web app</a>`);
    if (a.links.android) open.push(`<a class="btn" href="${a.links.android}" rel="noopener">Get the Android app</a>`);
    if (a.links.github) open.push(`<a class="${open.length ? 'btn-ghost' : 'btn'}" href="${a.links.github}" rel="noopener">View source on GitHub</a>`);
    open.push(`<a class="btn-ghost" href="mailto:${site.email}?subject=${encodeURIComponent(a.name + ' support')}">Email support</a>`);
    const body = `
<section class="page-head">
  <div class="wrap">
    <p class="crumbs"><a href="/apps/">Apps</a> / ${esc(a.name)}</p>
    <div class="app-feature">
      <div>
        <h1>${esc(a.name)}</h1>
        <p class="lede">${esc(a.tagline)}</p>
        <p class="status">${esc(a.status)}</p>
        <div class="actions">${open.join('')}</div>
      </div>
      ${appArt()}
    </div>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="section-head"><h2>What it does</h2><p>${esc(a.summary)}</p></div>
    <div class="grid grid-3">
      ${a.features.map((f) => `<div class="card"><h3>${esc(f.name)}</h3><p class="muted">${esc(f.text)}</p></div>`).join('')}
    </div>
  </div>
</section>
<section>
  <div class="wrap grid grid-2">
    <div>
      <h2>Built with</h2>
      ${tagList(a.stack)}
    </div>
    <div>
      <h2>Your data stays yours</h2>
      <p>${a.privacy.collectsData ? 'See the privacy policy for what this app collects and why.' : `${esc(a.name)} collects no personal data. Your files are stored ${esc(a.privacy.storage)}.`}</p>
      <p><a href="/privacy/${a.slug}/">Read the ${esc(a.name)} privacy policy</a></p>
    </div>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="card">
      <h2>Feedback and support</h2>
      <p>Found a bug or have an idea? Email <a href="mailto:${site.email}?subject=${encodeURIComponent(a.name + ' feedback')}">${esc(site.email)}</a>${a.links.github ? ` or open an issue on <a href="${a.links.github}" rel="noopener">GitHub</a>` : ''}.</p>
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
${pageHead('Projects', 'Each card starts with the problem. Flip it to see what I built and how.')}
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

// Blog
{
  const body = `
${pageHead('Blog', 'Notes on .NET, React, Azure, building apps and learning in public.')}
<section>
  <div class="wrap">
    ${posts.length ? `<ul class="post-list">${posts.map(postItem).join('')}</ul>` : '<p>Posts are coming soon.</p>'}
    <p class="meta"><a href="/feed.xml">Subscribe with RSS</a></p>
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
    <p class="meta">${fmtDate(p.date)} &middot; ${p.minutes} min read &middot; by ${esc(site.name)}</p>
    ${tagList(p.tags)}
  </div>
</section>
<section>
  <div class="wrap">
    <article class="prose">
${p.html}
    </article>
    <div class="actions"><a class="btn-ghost" href="/blog/">All posts</a><a class="btn-ghost" href="mailto:${site.email}?subject=${encodeURIComponent('Re: ' + p.title)}">Reply by email</a></div>
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
${pageHead('Privacy policy', 'What this website does and does not do with your information.')}
<section>
  <div class="wrap">
    <div class="prose legal">
      <p class="meta">Last updated ${fmtDate(BUILD_DATE)}</p>
      <h2>The short version</h2>
      <p>This website does not use cookies, analytics, advertising or tracking scripts, and it has no forms or accounts. I do not collect personal information through it.</p>
      <h2>What happens when you visit</h2>
      <p>The site is hosted on GitHub Pages. Like any web host, GitHub may record technical information such as your IP address and the pages requested when your browser loads files. I do not receive or use that information. See <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">GitHub's privacy statement</a> for how it handles it.</p>
      <h2>Fonts</h2>
      <p>Fonts are loaded from Google Fonts, so your browser contacts Google's font servers when a page opens. Google receives technical request information, such as your IP address, as described in its own policies.</p>
      <h2>If you email me</h2>
      <p>Links on this site open your email app. If you write to me at <a href="mailto:${site.email}">${esc(site.email)}</a>, I will use your message and address only to reply to you, and I will not share them.</p>
      <h2>Links to other sites</h2>
      <p>This site links to GitHub, LinkedIn and other websites. Their privacy practices are their own.</p>
      <h2>My apps</h2>
      <p>Each app has its own privacy policy:</p>
      <ul>${apps.map((a) => `<li><a href="/privacy/${a.slug}/">${esc(a.name)}</a></li>`).join('')}</ul>
      <h2>Changes</h2>
      <p>If this changes, for example if I add analytics, I will update this page and its date before the change goes live.</p>
      <h2>Contact</h2>
      <p>Questions about privacy: <a href="mailto:${site.email}">${esc(site.email)}</a>.</p>
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
<p>${esc(a.name)} does not collect, store on a server, share or sell any personal data. It has no accounts, no analytics, no advertising and no third-party tracking.</p>
<h2>Where your data lives</h2>
<p>The documents you open and the highlights, bookmarks, reading progress and flashcards you create are stored ${esc(p.storage)}. They are not uploaded anywhere. I cannot see them.</p>
<h2>Network use</h2>
<p>The app may use the network to load or update its own files. If you use the web version, the server that delivers those files may keep standard technical logs, such as your IP address, as any web host does. ${esc(a.name)} does not send your documents or your reading data to any server.</p>
<h2>Deleting your data</h2>
<p>Because everything is on your device, you control it. Removing the app or clearing the site's storage in your browser or phone settings deletes your library and everything attached to it.</p>
<h2>Children</h2>
<p>${esc(a.name)} does not knowingly collect information from anyone, including children.</p>
<h2>Changes</h2>
<p>If a future version collects any data, I will update this policy and its date before releasing that version.</p>
<h2>Contact</h2>
<p>Questions about this policy: <a href="mailto:${site.email}">${esc(site.email)}</a>.</p>`;
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
${pageHead('Contact', `${site.availability}. For roles, collaboration or app feedback, email is best.`)}
<section>
  <div class="wrap">
    <ul class="contact-list">
      <li><span>Email</span><a href="mailto:${site.email}">${esc(site.email)}</a></li>
      <li><span>LinkedIn</span><a href="${site.linkedin}" rel="noopener">ramesh-mangalagiri</a></li>
      <li><span>GitHub</span><a href="${site.github}" rel="noopener">Ramesh240</a></li>
      <li><span>Location</span>${esc(site.location)}</li>
    </ul>
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
    <div class="actions"><a class="btn" href="/">Home</a><a class="btn-ghost" href="/apps/">Apps</a><a class="btn-ghost" href="/blog/">Blog</a></div>
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

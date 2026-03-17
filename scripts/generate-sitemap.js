const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const siteUrl = (process.env.SITE_URL || 'https://www.yororoice.top').replace(/\/$/, '');
const apiHost = (process.env.REACT_APP_SERVER_HOST || process.env.SERVER_HOST || '').replace(/\/$/, '');
const today = new Date().toISOString().split('T')[0];

const routes = [
  { path: '/town', changefreq: 'daily', priority: '1.0' },
  { path: '/town/moments', changefreq: 'daily', priority: '0.9' },
  { path: '/town/gallery', changefreq: 'weekly', priority: '0.8' },
  { path: '/town/articles', changefreq: 'daily', priority: '0.9' },
  { path: '/town/archive', changefreq: 'weekly', priority: '0.8' },
  { path: '/town/lol', changefreq: 'monthly', priority: '0.5' },
  { path: '/town/other', changefreq: 'monthly', priority: '0.6' },
  { path: '/account/login', changefreq: 'monthly', priority: '0.4' },
  { path: '/account/register', changefreq: 'monthly', priority: '0.4' },
  { path: '/account/town-law', changefreq: 'yearly', priority: '0.3' },
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toDateOnly(value) {
  if (!value) return today;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return today;
  return d.toISOString().split('T')[0];
}

async function fetchJson(url) {
  const resp = await fetch(url, { method: 'GET' });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} ${url}`);
  }
  return resp.json();
}

function extractArticleItems(payload) {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function extractTotalPages(payload) {
  const candidates = [
    payload?.totalPages,
    payload?.meta?.totalPages,
    payload?.pagination?.totalPages,
    payload?.data?.totalPages,
    payload?.data?.meta?.totalPages,
    payload?.data?.pagination?.totalPages,
  ].map(Number).filter((n) => Number.isFinite(n) && n > 0);
  return candidates[0] || null;
}

async function getDynamicRoutes() {
  if (!apiHost) {
    console.warn('[sitemap] REACT_APP_SERVER_HOST/SERVER_HOST 未设置，跳过动态 URL 采集');
    return [];
  }

  const dynamic = [];

  // moments: /town/moments?mid=<id>
  try {
    const momentsRes = await fetchJson(`${apiHost}/api/moments/get?isEditing=false`);
    const moments = Array.isArray(momentsRes?.data) ? momentsRes.data : [];
    for (const m of moments) {
      if (!m?._id) continue;
      dynamic.push({
        path: `/town/moments?mid=${encodeURIComponent(m._id)}`,
        changefreq: 'daily',
        priority: '0.7',
        lastmod: toDateOnly(m.updatedAt || m.createdAt),
      });
    }
    console.log(`[sitemap] moments collected: ${moments.length}`);
  } catch (err) {
    console.warn('[sitemap] moments 采集失败:', err.message);
  }

  // articles: /town/articles?kid=<id>
  try {
    const limit = 100;
    const maxPages = 100;
    const all = [];
    const seen = new Set();
    let page = 1;
    let totalPages = null;

    while (page <= maxPages) {
      const res = await fetchJson(`${apiHost}/api/knowledge?page=${page}&limit=${limit}`);
      const list = extractArticleItems(res);
      const before = seen.size;

      for (const item of list) {
        const id = item?._id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        all.push(item);
      }

      if (totalPages === null) totalPages = extractTotalPages(res);

      const noNewItems = seen.size === before;
      const hitEndBySize = list.length < limit;
      const hitEndByPages = totalPages !== null && page >= totalPages;
      if (noNewItems || hitEndBySize || hitEndByPages) break;
      page += 1;
    }

    for (const a of all) {
      if (!a?._id) continue;
      dynamic.push({
        path: `/town/articles?kid=${encodeURIComponent(a._id)}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: toDateOnly(a.updatedAt || a.createdAt),
      });
    }
    console.log(`[sitemap] articles collected: ${all.length}`);
  } catch (err) {
    console.warn('[sitemap] articles 采集失败:', err.message);
  }

  return dynamic;
}

async function main() {
  const dynamicRoutes = await getDynamicRoutes();
  const allRoutes = [
    ...routes.map((r) => ({ ...r, lastmod: today })),
    ...dynamicRoutes,
  ];

  const dedup = [];
  const seen = new Set();
  for (const route of allRoutes) {
    const key = route.path;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(route);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    dedup
      .map(({ path: routePath, changefreq, priority, lastmod }) => `  <url>\n    <loc>${escapeXml(`${siteUrl}${routePath}`)}</loc>\n    <lastmod>${lastmod || today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`)
      .join('\n') +
    `\n</urlset>\n`;

  const rootDir = path.resolve(__dirname, '..');
  const publicTarget = path.join(rootDir, 'public', 'sitemap.xml');
  const buildTarget = path.join(rootDir, 'build', 'sitemap.xml');

  fs.writeFileSync(publicTarget, xml, 'utf8');

  if (fs.existsSync(path.join(rootDir, 'build'))) {
    fs.writeFileSync(buildTarget, xml, 'utf8');
  }

  console.log(`sitemap generated: ${publicTarget}`);
  if (fs.existsSync(path.join(rootDir, 'build'))) {
    console.log(`sitemap generated: ${buildTarget}`);
  }
  console.log(`[sitemap] total urls: ${dedup.length}`);
}

main().catch((err) => {
  console.error('[sitemap] failed:', err);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

const siteUrl = (process.env.SITE_URL || 'https://www.yororoice.top').replace(/\/$/, '');
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

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  routes
    .map(({ path: routePath, changefreq, priority }) => `  <url>\n    <loc>${siteUrl}${routePath}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`)
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

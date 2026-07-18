export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easymess.vercel.app';

  // Public static pages
  const staticPages = [
    '',
    '/features',
    '/pricing',
    '/about',
    '/contact',
    '/faq',
    '/blog',
    '/privacy',
    '/terms',
  ];

  const sitemapEntries = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/features' || route === '/pricing' ? 0.8 : 0.5,
  }));

  return sitemapEntries;
}

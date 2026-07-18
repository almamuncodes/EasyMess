export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easymess.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/features',
          '/pricing',
          '/about',
          '/contact',
          '/faq',
          '/blog',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/join-mess',
          '/create-mess',
          '/profile',
          '/profile/*',
          '/notice',
          '/notice/*',
          '/api/*',
          '/signin',
          '/signup',
          '/*?*q=',
          '/*?*filter=',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

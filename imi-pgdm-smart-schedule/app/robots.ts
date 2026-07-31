import type { MetadataRoute } from 'next';

const SITE_URL = 'https://imi-pgdm-smart-schedule-iota.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

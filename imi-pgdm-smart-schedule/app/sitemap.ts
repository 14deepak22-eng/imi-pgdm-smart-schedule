import type { MetadataRoute } from 'next';

const SITE_URL = 'https://imi-pgdm-smart-schedule-iota.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    {
      path: '',
      priority: 1.0,
    },
    {
      path: '/events',
      priority: 0.9,
    },
    {
      path: '/notices',
      priority: 0.9,
    },
    {
      path: '/progress',
      priority: 0.8,
    },
    {
      path: '/settings',
      priority: 0.7,
    },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route.priority,
  }));
}

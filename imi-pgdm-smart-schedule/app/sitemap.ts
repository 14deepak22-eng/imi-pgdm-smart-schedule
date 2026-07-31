import type { MetadataRoute } from 'next';

// Your live Vercel URL (the stable one from the Domains section, not the
// per-deployment one that changes on every push).
const SITE_URL = 'https://imi-pgdm-smart-schedule-iota.vercel.app';

// Next.js auto-serves this at /sitemap.xml — no manual XML needed.
// Only lists the 5 real pages; /api/sheet is a data endpoint, not a page,
// so it's intentionally left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/events', '/notices', '/progress', '/settings'];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));
}

import { getRssString } from '@astrojs/rss';
import { getCollection } from 'astro:content';

import { SITE, METADATA } from 'astrowind:config';

export const GET = async () => {
  const [reviews, comparisons] = await Promise.all([
    getCollection('reviews'),
    getCollection('comparisons'),
  ]);

  const items = [
    ...reviews
      .filter((r) => !r.data.draft)
      .map((r) => ({
        link: `/reviews/${r.id}`,
        title: r.data.title,
        description: r.data.excerpt,
        pubDate: new Date(r.data.publishDate),
      })),
    ...comparisons
      .filter((c) => !c.data.draft)
      .map((c) => ({
        link: `/comparativas/${c.id}`,
        title: c.data.title,
        description: c.data.excerpt,
        pubDate: new Date(c.data.publishDate),
      })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  const rss = await getRssString({
    title: SITE.name,
    description: METADATA?.description || '',
    site: import.meta.env.SITE,
    items,
    trailingSlash: SITE.trailingSlash,
  });

  return new Response(rss, {
    headers: { 'Content-Type': 'application/xml' },
  });
};

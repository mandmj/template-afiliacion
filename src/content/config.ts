import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.string().url().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const postCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/data/post' }),
  schema: z.object({
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),

    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),

    metadata: metadataDefinition(),
  }),
});

const retailerOffer = z.object({
  name: z.string(), // 'PcComponentes', 'MediaMarkt', 'AliExpress'...
  merchantId: z.string().optional(), // Awin merchant ID (si aplica)
  network: z.enum(['amazon', 'awin', 'direct']).default('awin'),
  price: z.number().optional(),
  url: z.string().url(), // URL final del producto en esa tienda
  inStock: z.boolean().default(true),
});

const productRef = z.object({
  asin: z.string(),
  title: z.string(),
  brand: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().default('EUR'),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().optional(),
  image: z.string().optional(),
  url: z.string().url(),
  features: z.array(z.string()).optional(),
  retailers: z.array(retailerOffer).optional(), // vendedores alternativos (Awin)
});

const reviewCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/content/reviews' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),
    excerpt: z.string(),
    image: z.string().optional(),
    category: z.string().default('Reviews'),
    tags: z.array(z.string()).optional(),
    author: z.string().default('Equipo {{SITE_NAME}}'),

    product: productRef,
    rating: z.number().min(0).max(10),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    verdict: z.string(),

    metadata: metadataDefinition(),
  }),
});

const comparisonCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/content/comparisons' }),
  schema: z.object({
    title: z.string(),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),
    excerpt: z.string(),
    image: z.string().optional(),
    category: z.string().default('Comparativas'),
    tags: z.array(z.string()).optional(),
    author: z.string().default('Equipo {{SITE_NAME}}'),

    products: z.array(productRef).min(2),
    winner: z.string().optional(),

    metadata: metadataDefinition(),
  }),
});

const guideCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/content/guides' }),
  schema: z.object({
    title: z.string(),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),
    excerpt: z.string(),
    image: z.string().optional(),
    category: z.string().default('Guías'),
    tags: z.array(z.string()).optional(),
    author: z.string().default('Equipo {{SITE_NAME}}'),

    metadata: metadataDefinition(),
  }),
});

export const collections = {
  post: postCollection,
  reviews: reviewCollection,
  comparisons: comparisonCollection,
  guides: guideCollection,
};

import { z } from 'zod';

export const authoredAssetSchema = z.object({
  id: z.string().regex(/^nv-[a-z0-9-]+$/).optional(), sourceFile: z.string().min(1), title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(), category: z.enum(['Icons', 'Banners', 'Animated', 'Wallpapers']).optional(),
  collectionSlugs: z.array(z.string()).default([]), tags: z.array(z.string()).default([]), uploadDate: z.iso.date().optional(),
  requiresDiscordAuth: z.boolean().default(false), protectedDownloadPath: z.string().startsWith('/').optional(),
  animated: z.boolean().optional(), attribution: z.string().optional(), sourceNote: z.string().optional(),
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export const authoredCollectionSchema = z.object({
  id: z.string().regex(/^col-[a-z0-9-]+$/), slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(1), description: z.string(), coverAssetId: z.string().nullable().default(null),
  assetIds: z.array(z.string()).optional(), tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false), featuredOrder: z.number().int().nonnegative().optional(), public: z.boolean().default(true), accessNote: z.string().optional(),
});

export const authoredAssetsFileSchema = z.object({ version: z.literal(1), assets: z.array(authoredAssetSchema) });
export const authoredCollectionsFileSchema = z.object({ version: z.literal(1), collections: z.array(authoredCollectionSchema) });
export const authoredCategoriesFileSchema = z.object({
  version: z.literal(1), categories: z.array(z.object({
    id: z.string().regex(/^cat-[a-z0-9-]+$/), slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string(), description: z.string().optional(), coverAssetId: z.string().nullable().default(null), visible: z.boolean().default(true), order: z.number().int().nonnegative().default(0),
    filter: z.discriminatedUnion('type', [
      z.object({ type: z.literal('folder'), category: z.enum(['Icons', 'Banners', 'Animated', 'Wallpapers']) }),
      z.object({ type: z.literal('tags'), tags: z.array(z.string()).min(1) }),
      z.object({ type: z.literal('assets'), assetIds: z.array(z.string()) }),
      z.object({ type: z.literal('collection'), collectionId: z.string() }),
    ]).optional(),
  })),
});

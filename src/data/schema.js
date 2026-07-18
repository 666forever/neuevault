import { z } from 'zod';

const generatedAssetSchema = z.object({
  id: z.string(), title: z.string(), slug: z.string(), sourceFile: z.string(), previewFile: z.string().startsWith('/media/previews/'), previewUrl: z.string().url().optional(),
  previewSources: z.array(z.object({ width: z.number(), url: z.string().url() })).optional(), src: z.union([z.string().startsWith('/media/originals/'), z.string().url()]).nullable(), downloadUrl: z.string().url().nullable().optional(), category: z.string(), collectionSlugs: z.array(z.string()), tags: z.array(z.string()),
  width: z.number().positive(), height: z.number().positive(), aspectRatio: z.number().positive(), orientation: z.enum(['Square', 'Landscape', 'Portrait']),
  fileType: z.string(), mimeType: z.string().startsWith('image/'), fileSize: z.number().nonnegative(), uploadDate: z.iso.date(), animated: z.boolean(),
  requiresDiscordAuth: z.boolean(), protectedDownloadPath: z.string().startsWith('/').optional(), attribution: z.string().optional(), sourceNote: z.string().optional(),
  cloudinaryAssetId: z.string().optional(), cloudinaryPublicId: z.string().optional(), cloudinaryVersion: z.number().optional(), cloudinaryDeliveryType: z.enum(['upload', 'private', 'authenticated']).optional(), originalDelivery: z.object({ url: z.string().url().optional(), resourceType: z.string(), deliveryType: z.string() }).optional(),
}).superRefine((asset, context) => {
  if (!Number.isFinite(asset.aspectRatio) || asset.aspectRatio < 0.05 || asset.aspectRatio > 20) context.addIssue({ code: 'custom', path: ['aspectRatio'], message: 'Asset aspect ratio is outside safe UI bounds.' });
  if (asset.requiresDiscordAuth && asset.src !== null) context.addIssue({ code: 'custom', path: ['src'], message: 'Restricted originals must not have a public src.' });
  if (!asset.requiresDiscordAuth && !asset.src) context.addIssue({ code: 'custom', path: ['src'], message: 'Public assets require an original src.' });
});

const collectionSchema = z.object({ id: z.string(), slug: z.string(), title: z.string(), description: z.string(), coverAssetId: z.string().nullable(), assetIds: z.array(z.string()), tags: z.array(z.string()), count: z.number(), featured: z.boolean(), featuredOrder: z.number().optional(), public: z.boolean(), accessNote: z.string().optional() });
const categoryFilterSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('folder'), category: z.string() }),
  z.object({ type: z.literal('tags'), tags: z.array(z.string()) }),
  z.object({ type: z.literal('assets'), assetIds: z.array(z.string()) }),
  z.object({ type: z.literal('collection'), collectionId: z.string() }),
]);
const categorySchema = z.object({ id: z.string(), slug: z.string(), title: z.string(), description: z.string().optional(), count: z.number(), coverAssetId: z.string().nullable(), image: z.string(), visible: z.boolean(), order: z.number(), filter: categoryFilterSchema.optional() });

export function validateGeneratedData(data) {
  if (!import.meta.env?.DEV) return data;
  return { assets: z.array(generatedAssetSchema).parse(data.assets), collections: z.array(collectionSchema).parse(data.collections), categories: z.array(categorySchema).parse(data.categories) };
}

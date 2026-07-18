import { z } from 'zod';

const generatedAssetSchema = z.object({
  id: z.string(), title: z.string(), slug: z.string(), sourceFile: z.string(), previewFile: z.string().startsWith('/media/previews/'),
  src: z.string().startsWith('/media/originals/').nullable(), category: z.string(), collectionSlugs: z.array(z.string()), tags: z.array(z.string()),
  width: z.number().positive(), height: z.number().positive(), aspectRatio: z.number().positive(), orientation: z.enum(['Square', 'Landscape', 'Portrait']),
  fileType: z.string(), mimeType: z.string().startsWith('image/'), fileSize: z.number().nonnegative(), uploadDate: z.iso.date(), animated: z.boolean(),
  requiresDiscordAuth: z.boolean(), protectedDownloadPath: z.string().startsWith('/').optional(), attribution: z.string().optional(), sourceNote: z.string().optional(),
}).superRefine((asset, context) => {
  if (asset.requiresDiscordAuth && asset.src !== null) context.addIssue({ code: 'custom', path: ['src'], message: 'Restricted originals must not have a public src.' });
  if (!asset.requiresDiscordAuth && !asset.src) context.addIssue({ code: 'custom', path: ['src'], message: 'Public assets require an original src.' });
});

const collectionSchema = z.object({ slug: z.string(), title: z.string(), description: z.string(), coverAssetId: z.string(), assetIds: z.array(z.string()), tags: z.array(z.string()), count: z.number(), featured: z.boolean(), featuredOrder: z.number().optional(), public: z.boolean(), accessNote: z.string().optional() });
const categorySchema = z.object({ slug: z.string(), filterTag: z.string(), title: z.string(), count: z.number(), image: z.string() });

export function validateGeneratedData(data) {
  if (!import.meta.env?.DEV) return data;
  return { assets: z.array(generatedAssetSchema).parse(data.assets), collections: z.array(collectionSchema).parse(data.collections), categories: z.array(categorySchema).parse(data.categories) };
}

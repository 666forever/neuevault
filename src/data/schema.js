import { z } from 'zod';

const url = z.string().url();
const asset = z.object({
  id: z.string().min(1), title: z.string().min(1), src: url.nullable(), preview: url,
  protectedDownloadPath: z.string().startsWith('/').optional(), category: z.string().min(1),
  collection: z.string().min(1), tags: z.array(z.string()), width: z.number().positive(),
  height: z.number().positive(), fileType: z.string(), fileSize: z.string(),
  uploadDate: z.iso.date(), animated: z.boolean(), requiresDiscordAuth: z.boolean(),
}).superRefine((item, context) => {
  if (item.requiresDiscordAuth && item.src !== null) context.addIssue({ code: 'custom', path: ['src'], message: 'Restricted originals must not have a public src.' });
  if (!item.requiresDiscordAuth && !item.src) context.addIssue({ code: 'custom', path: ['src'], message: 'Public assets require an original src.' });
});

export const vaultSchema = z.object({
  integrations: z.object({ discord: z.object({ enabled: z.literal(false), oauthStartPath: z.string(), sessionPath: z.string(), signOutPath: z.string() }) }),
  categories: z.array(z.object({ slug: z.string(), filterTag: z.string(), title: z.string(), count: z.number().nonnegative(), image: url })),
  collections: z.array(z.object({ slug: z.string(), title: z.string(), description: z.string(), count: z.number().nonnegative(), tags: z.array(z.string()), restricted: z.boolean().optional(), cover: url })),
  assets: z.array(asset),
});

export function validateVaultData(data) {
  if (!import.meta.env?.DEV) return data;
  return vaultSchema.parse(data);
}

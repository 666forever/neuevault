export const categorySegment = category => String(category).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const cloudinaryOriginalPublicId = asset => `neuevault/${asset.requiresDiscordAuth ? 'restricted' : 'public'}/${categorySegment(asset.category)}/${asset.id}`;
export const cloudinaryPreviewPublicId = asset => `neuevault/previews/${categorySegment(asset.category)}/${asset.id}`;
export const expectedDeliveryType = asset => asset.requiresDiscordAuth ? 'authenticated' : 'upload';

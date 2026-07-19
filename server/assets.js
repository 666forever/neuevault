import assets from '../src/generated/assets.json';
import cloudinaryState from '../content/cloudinary-sync.json';

const assetMap = new Map(assets.map(asset => {
  if (!asset.requiresDiscordAuth) return [asset.id, asset];
  const original = cloudinaryState.assets?.[asset.id]?.original;
  const trusted = original ? { ...asset, cloudinaryPublicId: original.publicId, cloudinaryDeliveryType: original.deliveryType, originalDelivery: { resourceType: original.resourceType, deliveryType: original.deliveryType } } : asset;
  return [asset.id, trusted];
}));
export const getTrustedAsset = id => assetMap.get(id) || null;

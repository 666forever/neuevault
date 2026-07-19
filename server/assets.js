import assets from '../src/generated/assets.json' with { type: 'json' };

const assetMap = new Map(assets.map(asset => [asset.id, asset]));
export const getTrustedAsset = id => assetMap.get(id) || null;

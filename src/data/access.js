export const isRestricted = asset => asset.requiresDiscordAuth === true;
export const canDownloadOriginal = asset => !isRestricted(asset) && Boolean(asset.src);
export const getDisplaySource = asset => isRestricted(asset) ? asset.preview : (asset.src || asset.preview);

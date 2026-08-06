const BASE_FIELDS = new Set(['id','title','slug','sourceFile','previewFile','src','category','collectionSlugs','tags','width','height','aspectRatio','orientation','fileType','mimeType','fileSize','uploadDate','animated','requiresDiscordAuth','protectedDownloadPath','attribution','sourceNote']);

export function reconstructHostedAssetFacts(authoredAssets, generatedAssets) {
  const generatedBySource = new Map(generatedAssets.map(asset => [asset.sourceFile, asset]));
  return authoredAssets.map((authored, sourceOrder) => {
    const generated = generatedBySource.get(authored.sourceFile);
    if (!generated) throw new Error(`Missing generated asset facts for ${authored.sourceFile}.`);
    const generatedFields = Object.fromEntries(Object.entries(generated).filter(([key]) => !BASE_FIELDS.has(key)));
    return { sourceOrder, sourceFile: authored.sourceFile, sourceHash: authored.sourceHash, id: generated.id, title: generated.title, category: generated.category, width: generated.width, height: generated.height, aspectRatio: generated.aspectRatio, fileType: generated.fileType, mimeType: generated.mimeType, fileSize: generated.fileSize, uploadDate: generated.uploadDate, animated: generated.animated, previewFile: generated.previewFile, publicSource: authored.requiresDiscordAuth ? null : generated.src, generatedFields };
  });
}

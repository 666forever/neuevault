export function printAssetUpdateReport(report, cloud = null, { dryRun = false } = {}) {
  const list = (label, items, render, limit = 20) => { console.log(`${label}: ${items.length}`); for (const item of items.slice(0, limit)) console.log(`  ${render(item)}`); if (items.length > limit) console.log(`  … ${items.length - limit} more`); };
  console.log(`\nNeuevault asset update ${dryRun ? 'dry-run ' : ''}report`);
  list('Files added', report.added, item => `${item.sourceFile} -> ${item.id}`);
  list('Files changed', report.changed, item => `${item.sourceFile} (${item.id})`);
  list('Files removed', report.removed, item => `${item.sourceFile} (${item.id})`);
  list('IDs allocated', report.added, item => `${item.id} = ${item.sourceFile}`);
  list('Metadata requiring editorial review', report.editorialReview, item => item);
  list('Warnings', report.warnings, item => item);
  if (report.indexed.length) console.log(`Existing files indexed with hashes: ${report.indexed.length}`);
  if (cloud) { list('Cloudinary uploads', cloud.uploaded || cloud.planned || [], item => typeof item === 'string' ? item : `${item.id}: ${item.deliveryType} ${item.publicId}`); list('Cloudinary skips', cloud.skipped || [], item => item); }
}

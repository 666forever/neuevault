import { generateAssets } from './asset-pipeline/generator.mjs';

try {
  const clean = process.argv.includes('--clean'); const { assets, collections, categories, report } = await generateAssets({ clean });
  for (const warning of report.warnings) console.warn(`Warning: ${warning}`);
  console.log(`Generated ${assets.length} assets, ${collections.length} collections, and ${categories.length} categories.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }

import { generateAssets } from './asset-pipeline/generator.mjs';

try { const { assets, collections, categories } = await generateAssets({ writeOutput: false }); console.log(`Validated ${assets.length} assets, ${collections.length} collections, and ${categories.length} categories.`); }
catch (error) { console.error(error.message); process.exitCode = 1; }

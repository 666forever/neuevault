import { existsSync } from 'node:fs';
import { CloudinaryTransport } from './cloudinary/transport.mjs';
import { verifyCloudinary } from './cloudinary/verify.mjs';

if (existsSync('.env')) process.loadEnvFile('.env');
try { const result = await verifyCloudinary({ transport: new CloudinaryTransport() }); console.log(`Verified ${result.assets} manifest assets against ${result.remote} remote resources.`); }
catch (error) { console.error(error.message); process.exitCode = 1; }

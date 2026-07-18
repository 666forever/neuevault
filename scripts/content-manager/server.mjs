import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipelineConfig } from '../asset-pipeline/config.mjs';
import { generateAssets } from '../asset-pipeline/generator.mjs';
import { readJson } from '../asset-pipeline/filesystem.mjs';
import { reconcileAssetMetadata } from '../asset-update/reconcile.mjs';
import { prepareContentSave, summarizeContentDiff } from './model.mjs';
import { persistContentFiles } from './persistence.mjs';
import { mimeFor } from '../asset-pipeline/normalize.mjs';

const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ui');
const json = (response, status, value) => { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(JSON.stringify(value)); };
const body = request => new Promise((resolve, reject) => { let value = ''; request.on('data', chunk => { value += chunk; if (value.length > 20_000_000) reject(new Error('Request too large')); }); request.on('end', () => { try { resolve(JSON.parse(value)); } catch (error) { reject(error); } }); });

async function currentState() {
  const reconciliation = await reconcileAssetMetadata(); return { assets: reconciliation.assetsFile.assets, categories: reconciliation.categoriesFile.categories, collections: reconciliation.collectionsFile.collections, scanReport: reconciliation.report };
}

export function createContentManagerServer() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      if (request.method === 'GET' && url.pathname === '/api/state') return json(response, 200, await currentState());
      if (request.method === 'POST' && url.pathname === '/api/save') {
        const original = await currentState(); const candidate = await body(request); const prepared = prepareContentSave(original, candidate); const summary = summarizeContentDiff(original, { categories: prepared.categoriesFile.categories, collections: prepared.collectionsFile.collections, assets: prepared.assetsFile.assets }); const backupPath = await persistContentFiles(prepared); await generateAssets(); return json(response, 200, { ok: true, summary, backupPath, slugMigrations: prepared.slugMigrations });
      }
      if (request.method === 'GET' && url.pathname.startsWith('/source/')) { const relative = decodeURIComponent(url.pathname.slice('/source/'.length)); const file = path.resolve(pipelineConfig.sourceRoot, relative); if (!file.startsWith(path.resolve(pipelineConfig.sourceRoot) + path.sep)) throw new Error('Invalid source path'); const bytes = await readFile(file); response.writeHead(200, { 'content-type': mimeFor(path.extname(file)), 'cache-control': 'no-store' }); return response.end(bytes); }
      const asset = url.pathname === '/' ? 'index.html' : url.pathname.slice(1); if (!['index.html', 'manager.css', 'manager.js'].includes(asset)) { response.writeHead(404); return response.end('Not found'); }
      const bytes = await readFile(path.join(uiRoot, asset)); response.writeHead(200, { 'content-type': asset.endsWith('.html') ? 'text/html; charset=utf-8' : asset.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8', 'cache-control': 'no-store' }); response.end(bytes);
    } catch (error) { json(response, 400, { error: error.message }); }
  });
}

export function startContentManager({ port = 4317 } = {}) { const server = createContentManagerServer(); server.listen(port, '127.0.0.1', () => console.log(`Neuevault content manager: http://127.0.0.1:${port}`)); return server; }

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export async function walkFiles(root) {
  const output = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute); else if (entry.isFile()) output.push(absolute);
    }
  }
  try { await walk(root); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return output;
}

export async function readJson(file) { return JSON.parse(await readFile(file, 'utf8')); }
export async function exists(file) { try { await stat(file); return true; } catch { return false; } }

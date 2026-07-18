import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { walkFiles } from '../../scripts/asset-pipeline/filesystem.mjs';

describe('Cloudinary credential boundary', () => {
  it('keeps credential names and admin SDK usage out of browser source', async () => {
    const files = await walkFiles(path.resolve('src')); const contents = await Promise.all(files.filter(file => /\.(js|json)$/.test(file)).map(file => readFile(file, 'utf8')));
    expect(contents.join('\n')).not.toContain('CLOUDINARY_API_SECRET'); expect(contents.join('\n')).not.toContain("from 'cloudinary'");
  });
});

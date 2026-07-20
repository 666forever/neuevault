import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { isChunkLoadError } from '../../src/utils/lazy.js';

describe('browser bundle architecture', () => {
  it('keeps development validation and uncommon features behind dynamic imports', async () => {
    const [app, repository, pages, lazy, packageJson] = await Promise.all([
      readFile('app.js', 'utf8'),
      readFile('src/data/repository.js', 'utf8'),
      readFile('src/pages/pages.js', 'utf8'),
      readFile('src/utils/lazy.js', 'utf8'),
      readFile('package.json', 'utf8'),
    ]);
    expect(repository).not.toMatch(/^import .*schema/m);
    expect(repository).toContain("import('./schema.js')");
    expect(app).toContain("import('./src/overlays/AssetModal.js')");
    expect(app).toContain("import('./src/overlays/AuthDialog.js')");
    expect(app).not.toMatch(/^import .*AssetModal/m);
    expect(pages).toContain("import('./searchPage.js')");
    expect(lazy).toContain("sessionStorage.getItem(key) !== 'retried'");
    expect(lazy).toContain('location.reload()');
    expect(packageJson).toContain('"audit:bundle"');
  });

  it('recognizes stale dynamic chunk failures without treating ordinary errors as reloadable', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new Error('Importing a module script failed'))).toBe(true);
    expect(isChunkLoadError(new Error('Search rendering failed'))).toBe(false);
  });
});

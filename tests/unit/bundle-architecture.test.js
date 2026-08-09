import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { isChunkLoadError } from '../../src/utils/lazy.js';

describe('browser bundle architecture', () => {
  it('keeps development validation and uncommon features behind dynamic imports', async () => {
    const [app, repository, pages, lazy, adminPage, adminWorkspace, adminAccess, adminEditor, adminUpload, adminPublication, packageJson] = await Promise.all([
      readFile('app.js', 'utf8'),
      readFile('src/data/repository.js', 'utf8'),
      readFile('src/pages/pages.js', 'utf8'),
      readFile('src/utils/lazy.js', 'utf8'),
      readFile('src/admin/AdminPage.js', 'utf8'),
      readFile('src/admin/AdminWorkspace.js', 'utf8'),
      readFile('src/admin/AdminAccess.js', 'utf8'),
      readFile('src/admin/AdminCatalogEditor.js', 'utf8'),
      readFile('src/admin/AdminAssetUpload.js', 'utf8'),
      readFile('src/admin/AdminPublicationStatus.js', 'utf8'),
      readFile('package.json', 'utf8'),
    ]);
    expect(repository).not.toMatch(/^import .*schema/m);
    expect(repository).toContain("import('./schema.js')");
    expect(app).toContain("import('./src/overlays/index.js')");
    expect(app).not.toContain("import('./src/overlays/AssetModal.js')");
    expect(app).not.toContain("import('./src/overlays/AuthDialog.js')");
    expect(app).not.toMatch(/^import .*AssetModal/m);
    expect(pages).toContain("import('./searchPage.js')");
    expect(app).toContain("import('./src/admin/AdminPage.js')");
    expect(app).not.toMatch(/^import .*AdminPage/m);
    expect(adminPage).toContain("import('./AdminWorkspace.js')");
    expect(adminWorkspace).toContain("import('./AdminAccess.js')");
    expect(adminWorkspace).toContain("import('./AdminCatalogEditor.js')");
    expect(adminWorkspace).not.toMatch(/^import .*AdminAccess/m);
    expect(adminWorkspace).toContain("import('./AdminAssetUpload.js')");
    expect(adminWorkspace).not.toMatch(/^import .*AdminAssetUpload/m);
    expect(adminEditor).toContain("import('./AdminPublicationStatus.js')");
    expect(adminUpload).toContain("import('./AdminPublicationStatus.js')");
    expect(adminPage).not.toMatch(/^import .*AdminPublicationStatus/m);
    expect(adminPage).not.toMatch(/content\/metadata|src\/generated|server\/admin|ADMIN_OWNER_DISCORD_ID|ADMIN_DB/);
    expect(`${adminPage}\n${adminWorkspace}\n${adminAccess}`).not.toMatch(/localStorage|sessionStorage|indexedDB|ADMIN_OWNER_DISCORD_ID|ADMIN_DB/);
    expect(`${app}\n${repository}\n${adminPage}\n${adminWorkspace}\n${adminAccess}\n${adminEditor}\n${adminUpload}\n${adminPublication}`).not.toMatch(/GITHUB_APP_PRIVATE_KEY|GITHUB_APP_INSTALLATION_ID|CLOUDFLARE_PAGES_READ_TOKEN|CLOUDINARY_API_SECRET|cloudinary-sync\.json|content\/metadata/);
    expect(adminUpload).not.toMatch(/server\/admin|ADMIN_DB|api_secret|localStorage|sessionStorage|indexedDB/);
    expect(lazy).toContain("sessionStorage.getItem(key) !== 'retried'");
    expect(lazy).toContain('location.reload()');
    expect(packageJson).toContain('"audit:bundle"');
  });

  it('budgets public and admin manifest graphs independently', async () => {
    const audit = await readFile('scripts/audit-bundle.mjs', 'utf8');
    expect(audit).toContain("src/admin/AdminPage.js");
    expect(audit).toContain("src/admin/AdminCatalogEditor.js");
    expect(audit).toContain("src/admin/AdminAccess.js");
    expect(audit).toContain("src/admin/AdminAssetUpload.js");
    expect(audit).toContain("src/admin/AdminPublicationStatus.js");
    expect(audit).toContain('publicTotals.gzip > budgets.publicGzip');
    expect(audit).toContain('adminPublicationGzip: 800');
    expect(audit).toContain('adminTotals.gzip > budgets.adminAggregateGzip');
    expect(audit).toContain("admin section is not lazy behind the workspace");
    expect(audit).not.toContain('totalGzip');
  });

  it('keeps the catalog compiler and Node adapter outside browser source', async () => {
    const [compiler, adapter, app, repository] = await Promise.all([
      readFile('server/catalog/compiler.js', 'utf8'),
      readFile('scripts/asset-pipeline/local-adapter.mjs', 'utf8'),
      readFile('app.js', 'utf8'),
      readFile('src/data/repository.js', 'utf8'),
    ]);
    expect(compiler).not.toMatch(/(?:from|import\s*\()\s*['"](?:node:|sharp|cloudinary)/);
    expect(compiler).not.toMatch(/\b(?:fetch|process|Date\.now|Math\.random)\b/);
    expect(adapter).toContain("from 'node:fs/promises'");
    expect(adapter).toContain("from 'sharp'");
    expect(`${app}\n${repository}`).not.toMatch(/catalog\/compiler|local-adapter/);
  });

  it('recognizes stale dynamic chunk failures without treating ordinary errors as reloadable', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new Error('Importing a module script failed'))).toBe(true);
    expect(isChunkLoadError(new Error('Search rendering failed'))).toBe(false);
  });
});

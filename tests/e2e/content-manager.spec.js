import { expect, test } from '@playwright/test';
import { createContentManagerServer } from '../../scripts/content-manager/server.mjs';

let server; let managerUrl;
test.beforeAll(async () => {
  server = createContentManagerServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  managerUrl = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

test('selection counters and computed collection count persist after save and reload', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  let apiState = {
    assets: [
      { id: 'nv-001', sourceFile: 'icons/a.jpg', title: 'A', category: 'Icons', tags: [], collectionSlugs: [], requiresDiscordAuth: false },
      { id: 'nv-002', sourceFile: 'icons/b.jpg', title: 'B', category: 'Icons', tags: [], collectionSlugs: [], requiresDiscordAuth: false },
      { id: 'nv-003', sourceFile: 'banners/c.jpg', title: 'C', category: 'Banners', tags: [], collectionSlugs: [], requiresDiscordAuth: false },
    ],
    categories: [],
    collections: [{ id: 'col-001', slug: 'test', title: 'Test', description: '', coverAssetId: null, tags: [], featured: false, public: false }],
    scanReport: {},
  };
  await page.route('**/api/state', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(apiState) }));
  await page.route('**/api/save', async route => { apiState = route.request().postDataJSON(); await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, backupPath: 'fixture-backup', summary: {} }) }); });
  await page.route('**/source/**', route => route.abort());
  page.on('dialog', dialog => dialog.accept());

  await page.goto(managerUrl); await page.getByRole('button', { name: 'Collections' }).click();
  await page.getByRole('button', { name: 'Select all visible' }).click();
  await expect(page.locator('#selection-count')).toHaveText('3 of 3 selected · 3 total');
  await page.getByRole('button', { name: 'Clear visible selection' }).click();
  await expect(page.locator('#selection-count')).toHaveText('0 of 3 selected · 0 total');

  await page.locator('.membership').nth(0).check(); await page.locator('.membership').nth(1).check();
  await expect(page.locator('#editor-count')).toHaveText('2');
  await expect(page.locator('#save-summary')).toContainText('Total after save: 2');
  await page.locator('#asset-search').fill('nv-001');
  await expect(page.locator('#selection-count')).toHaveText('1 of 1 selected · 2 total');
  await page.locator('#asset-search').fill('');
  await expect(page.locator('#selection-count')).toHaveText('2 of 3 selected · 2 total');
  await expect(page.locator('.asset.selected')).toHaveCount(2);

  await page.getByRole('button', { name: 'Review & save' }).click();
  await expect(page.locator('#editor-count')).toHaveText('2');
  await expect(page.locator('#save-summary')).toContainText('Assigned assets: 2');
  await expect(page.locator('.membership:checked')).toHaveCount(2);
});

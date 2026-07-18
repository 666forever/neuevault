import { expect, test } from '@playwright/test';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

test('mobile navigation keeps Collections and sign-in unavailable reachable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/'); await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.getByRole('link', { name: /Collections/ }).last()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in unavailable' }).last()).toBeVisible();
});

test('modal keyboard steps and restores the opening card focus', async ({ page }) => {
  await page.goto('/'); const first = page.locator('.asset-card').first(); await first.focus(); await first.click();
  const initial = await page.locator('#modal-title').textContent(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#modal-title')).not.toHaveText(initial); await page.keyboard.press('Escape'); await expect(first).toBeFocused();
});

test('deep-linked restricted assets expose only an unavailable boundary', async ({ page }) => {
  const protectedRequests = []; page.on('request', request => { if (request.url().includes('/api/')) protectedRequests.push(request.url()); });
  await page.goto('/#/asset/nv-005'); await expect(page.locator('#modal-title')).toHaveText('Velvet Figure');
  await expect(page.getByRole('button', { name: 'Authentication unavailable' })).toBeVisible();
  await expect(page.locator('.modal-preview img')).toHaveAttribute('src', '/media/previews/nv-005.jpg');
  await page.getByRole('button', { name: 'Authentication unavailable' }).click();
  await expect(page.locator('#auth-title')).toHaveText('Authentication unavailable'); expect(protectedRequests).toEqual([]);
});

test('public download requests the public original', async ({ page }) => {
  let requested = false;
  page.on('request', request => { if (request.url().includes('/media/originals/nv-001.jpg')) requested = true; });
  await page.goto('/#/asset/nv-001'); await page.getByRole('button', { name: /Download original/ }).click();
  await expect.poll(() => requested).toBe(true);
});

test('an ingested manifest asset appears in the gallery and opens its modal', async ({ page }) => {
  const manifest = JSON.parse(await readFile(path.resolve('src/generated/assets.json'), 'utf8'));
  expect(manifest.find(asset => asset.id === 'nv-001')).toMatchObject({ previewFile: '/media/previews/nv-001.jpg', src: '/media/originals/nv-001.jpg' });
  await page.goto('/'); const card = page.getByRole('button', { name: 'Open Silver Static' }); await expect(card).toBeVisible(); await card.click();
  await expect(page.locator('#modal-title')).toHaveText('Silver Static');
});

test('restricted source remains outside public and built output', async () => {
  for (const target of [path.resolve('public/media/originals/nv-005.jpg'), path.resolve('dist/media/originals/nv-005.jpg')]) {
    await expect(access(target)).rejects.toThrow();
  }
});

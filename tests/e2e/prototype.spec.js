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

test('sign-in remains an unavailable boundary without backend requests', async ({ page }, testInfo) => {
  const protectedRequests = []; page.on('request', request => { if (request.url().includes('/api/')) protectedRequests.push(request.url()); });
  await page.goto('/'); if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('button', { name: 'Sign in unavailable' }).last().click();
  await expect(page.locator('#auth-title')).toHaveText('Authentication unavailable'); expect(protectedRequests).toEqual([]);
});

test('public download requests the public original', async ({ page }) => {
  const [asset] = JSON.parse(await readFile(path.resolve('src/generated/assets.json'), 'utf8')); let requested = false;
  page.on('request', request => { if (request.url().includes(asset.src)) requested = true; });
  await page.goto(`/#/asset/${asset.id}`); await page.getByRole('button', { name: /Download original/ }).click();
  await expect.poll(() => requested).toBe(true);
});

test('an ingested manifest asset appears in the gallery and opens its modal', async ({ page }) => {
  const manifest = JSON.parse(await readFile(path.resolve('src/generated/assets.json'), 'utf8'));
  const asset = manifest[0]; expect(asset.src).toMatch(/^\/media\/originals\//);
  await page.goto('/'); const card = page.getByRole('button', { name: `Open ${asset.title}` }); await expect(card).toBeVisible(); await card.click();
  await expect(page.locator('#modal-title')).toHaveText(asset.title);
});

test('restricted source remains outside public and built output', async () => {
  const manifest = JSON.parse(await readFile(path.resolve('src/generated/assets.json'), 'utf8'));
  for (const asset of manifest.filter(item => item.requiresDiscordAuth)) for (const root of ['public', 'dist']) await expect(access(path.resolve(root, asset.src || `media/originals/${path.basename(asset.sourceFile)}`))).rejects.toThrow();
});

test('animated gallery cards use bounded single-frame dimensions', async ({ page }) => {
  await page.goto('/#/recent');
  const animated = page.locator('.asset-card').filter({ has: page.locator('.format-badge') }).first();
  await expect(animated).toBeVisible();
  const box = await animated.boundingBox(); expect(box.height).toBeLessThan(900);
  await expect(animated.locator('.asset-overlay')).toContainText(/800×320|720×433|[1-9]\d*×[1-9]\d*/);
});

test('collection cards compose count and description without legacy count copy', async ({ page }) => {
  await page.goto('/#/collections');
  await expect(page.locator('a[href="#/collection/noface-icons"] .collection-meta p')).toHaveText('25 Anonymous and melancholic icons.');
  await expect(page.getByText('in full archive')).toHaveCount(0);
});

test('public animated cover loads only during hover or focus and returns static', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/#/collections'); const card = page.locator('a[href="#/collection/white-minimal-banners"]'); const animated = card.locator('.cover-animated');
  await expect(animated).not.toHaveAttribute('src'); await card.hover();
  await expect(animated).toHaveAttribute('src', /\/media\/originals\/nv-054\.gif$/); await expect(card).toHaveClass(/cover-playing/);
  await page.locator('.page-title').hover(); await expect(card).not.toHaveClass(/cover-playing/); await page.waitForTimeout(250); await expect(animated).not.toHaveAttribute('src');
  await card.focus(); await expect(animated).toHaveAttribute('src', /nv-054\.gif$/); await page.keyboard.press('Tab'); await expect(card).not.toHaveClass(/cover-playing/);
});

test('reduced motion and restricted cover policy remain static', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const protectedRequests = []; page.on('request', request => { if (request.url().includes('/restricted/') || request.url().includes('/authenticated/')) protectedRequests.push(request.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/#/collections'); const card = page.locator('a[href="#/collection/white-minimal-banners"]'); const animated = card.locator('.cover-animated');
  await card.hover(); await expect(animated).not.toHaveAttribute('src');
  const restrictedUrl = await page.evaluate(async () => (await import('/src/data/mediaUrls.js')).animatedCoverUrl({ animated: true, requiresDiscordAuth: true, src: null }));
  expect(restrictedUrl).toBe(''); expect(protectedRequests).toEqual([]);
});

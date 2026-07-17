import { expect, test } from '@playwright/test';

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
  await expect(page.locator('.modal-preview img')).toHaveAttribute('src', /w=900/);
  await page.getByRole('button', { name: 'Authentication unavailable' }).click();
  await expect(page.locator('#auth-title')).toHaveText('Authentication unavailable'); expect(protectedRequests).toEqual([]);
});

test('public download requests the public original', async ({ page }) => {
  let requested = false;
  await page.route('https://images.unsplash.com/**', async route => {
    if (route.request().url().includes('w=1800')) { requested = true; await route.fulfill({ status: 200, contentType: 'image/jpeg', body: 'image' }); }
    else await route.abort();
  });
  await page.goto('/#/asset/nv-001'); await page.getByRole('button', { name: /Download original/ }).click();
  await expect.poll(() => requested).toBe(true);
});

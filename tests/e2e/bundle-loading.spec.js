import { test, expect } from '@playwright/test';

test('homepage defers search and overlay feature modules until they are needed', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  const scripts = [];
  page.on('response', response => { if (response.request().resourceType() === 'script') scripts.push(response.url()); });
  await page.goto('/');
  expect(scripts.some(url => url.includes('searchPage'))).toBe(false);
  expect(scripts.some(url => url.includes('AssetModal'))).toBe(false);
  expect(scripts.some(url => url.includes('AuthDialog'))).toBe(false);

  await page.locator('.main-nav [data-nav="search"]').click();
  await expect(page).toHaveURL('/search');
  await expect(page.locator('#search-input')).toBeVisible();
  expect(scripts.filter(url => url.includes('searchPage'))).toHaveLength(1);

  await page.goto('/');
  await page.locator('.asset-card').first().click();
  await expect(page.locator('#asset-modal')).toBeVisible();
  expect(scripts.filter(url => url.includes('AssetModal'))).toHaveLength(1);
  expect(scripts.filter(url => url.includes('AuthDialog'))).toHaveLength(1);
});

test('a delayed lazy route cannot overwrite a newer navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.route('**/src/pages/searchPage.js*', async route => {
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.continue();
  });
  await page.goto('/');
  await page.locator('.main-nav [data-nav="search"]').click();
  await page.locator('.main-nav [data-nav="about"]').click();
  await expect(page).toHaveURL('/about');
  await expect(page.getByRole('heading', { name: 'Saved with intent.' })).toBeVisible();
  await page.waitForTimeout(350);
  await expect(page.locator('#search-input')).toHaveCount(0);
});

test('a failed route chunk reloads once and then exposes a retry state', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  let chunkRequests = 0;
  let documentRequests = 0;
  page.on('request', request => { if (request.resourceType() === 'document') documentRequests += 1; });
  await page.route('**/src/pages/searchPage.js*', route => { chunkRequests += 1; return route.abort('failed'); });
  await page.goto('/');
  await page.locator('.main-nav [data-nav="search"]').click();
  await expect(page).toHaveURL('/search');
  await expect(page.getByRole('heading', { name: 'This page could not be loaded.' })).toBeVisible();
  expect(chunkRequests).toBe(2);
  expect(documentRequests).toBe(2);
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('heading', { name: 'This page could not be loaded.' })).toBeVisible();
  expect(documentRequests).toBe(2);
});

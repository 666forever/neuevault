import { expect, test } from '@playwright/test';

const geometry = async page => page.locator('.masonry').evaluate(grid => {
  const gridRect = grid.getBoundingClientRect();
  return [...grid.querySelectorAll('.asset-card')].map((card, domIndex) => {
    const rect = card.getBoundingClientRect();
    return {
      id: card.dataset.assetId,
      domIndex,
      column: Number(card.dataset.column),
      x: rect.x - gridRect.x,
      y: rect.y - gridRect.y,
      width: rect.width,
      height: rect.height,
    };
  });
});

const expectStable = (before, after) => {
  for (const expected of before) {
    const actual = after.find(entry => entry.id === expected.id);
    expect(actual).toBeTruthy();
    expect(actual.domIndex).toBe(expected.domIndex);
    expect(actual.column).toBe(expected.column);
    for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(actual[key] - expected[key])).toBeLessThanOrEqual(1);
  }
};

test('asset geometry survives decode and append while source order stays authoritative', async ({ page }) => {
  await page.route('**/*', async route => {
    if (route.request().resourceType() === 'image') await new Promise(resolve => setTimeout(resolve, 250));
    await route.continue();
  });
  await page.goto('/recent');
  await page.locator('.asset-card').first().waitFor();
  await page.locator('.grid-sentinel').evaluate(node => node.remove());
  const reserved = await geometry(page);
  expect(reserved.length).toBeGreaterThanOrEqual(8);
  await page.locator('.asset-static').first().evaluate(image => image.decode?.().catch(() => {}));
  const decoded = await geometry(page);
  expectStable(reserved, decoded);

  const more = page.locator('.load-more:not([hidden])');
  if (await more.count()) await more.click();
  const appended = await geometry(page);
  expect(appended.length).toBe(Math.min(reserved.length + 16, 234));
  expectStable(reserved, appended);
  expect(appended.map(entry => entry.domIndex)).toEqual(appended.map((_, index) => index));
  expect(new Set(appended.map(entry => entry.id)).size).toBe(appended.length);

  for (let index = 0; index < appended.length; index += 1) {
    for (let other = index + 1; other < appended.length; other += 1) {
      const a = appended[index]; const b = appended[other];
      const overlaps = a.x < b.x + b.width - 0.5 && a.x + a.width > b.x + 0.5 && a.y < b.y + b.height - 0.5 && a.y + a.height > b.y + 0.5;
      expect(overlaps).toBe(false);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('resize creates one coherent generation and keyboard order remains DOM order', async ({ page }) => {
  await page.goto('/recent');
  await page.locator('.asset-card').first().waitFor();
  await page.locator('.grid-sentinel').evaluate(node => node.remove());
  const ids = await page.locator('.asset-card').evaluateAll(cards => cards.map(card => card.dataset.assetId));
  await page.setViewportSize({ width: 700, height: 900 });
  await page.waitForTimeout(50);
  const compact = await geometry(page);
  expect(new Set(compact.map(entry => entry.column)).size).toBeLessThanOrEqual(2);
  expect(compact.map(entry => entry.id)).toEqual(ids);
  await page.locator('.asset-card').first().focus();
  for (let index = 1; index < Math.min(ids.length, 8); index += 1) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.dataset.assetId)).toBe(ids[index]);
  }
});

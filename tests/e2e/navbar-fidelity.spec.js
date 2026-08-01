import { expect, test } from '@playwright/test';

const signedOut = page => page.route('**/api/auth/session*', route => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}',
}));

test('desktop navbar uses the compact measured composition', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await signedOut(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/recent');

  const geometry = await page.evaluate(() => {
    const rect = selector => {
      const value = document.querySelector(selector).getBoundingClientRect();
      return { x: value.x, y: value.y, width: value.width, height: value.height, center: value.x + value.width / 2 };
    };
    const link = document.querySelector('.main-nav > a');
    const linkStyle = getComputedStyle(link);
    const pill = getComputedStyle(link, '::before');
    return {
      header: rect('.site-header'), shell: rect('.nav-shell'), brand: rect('.brand'), logo: rect('.brand-logo-shell'),
      nav: rect('.main-nav'), link: rect('.main-nav > a'), actions: rect('.nav-actions'), signIn: rect('.sign-in'),
      collections: rect('.nav-actions .collections-button'), gap: getComputedStyle(document.querySelector('.main-nav')).gap,
      paddingInline: linkStyle.paddingInline, pillInset: [pill.top, pill.right, pill.bottom, pill.left],
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(geometry.header.height).toBe(62);
  expect(geometry.shell.x).toBeCloseTo(15, 0);
  expect(geometry.shell.width).toBeCloseTo(1410, 0);
  expect(geometry.brand.width).toBeGreaterThan(135);
  expect(geometry.brand.width).toBeLessThan(145);
  expect(geometry.logo).toMatchObject({ width: 34, height: 34 });
  expect(geometry.gap).toBe('2px');
  expect(geometry.paddingInline).toBe('15px');
  expect(geometry.link.height).toBe(40);
  expect(geometry.pillInset).toEqual(['0px', '0px', '0px', '0px']);
  expect(geometry.actions.height).toBe(38);
  expect(geometry.signIn.height).toBe(38);
  expect(geometry.collections.height).toBe(38);
  expect(Math.abs(geometry.nav.center - 720)).toBeLessThanOrEqual(1);
  expect(geometry.overflow).toBe(0);
  await expect(page.locator('[data-nav="recent"]')).toHaveAttribute('aria-current', 'page');
});

test('navbar pill and rolling label share one stable hit box', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await signedOut(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const link = page.locator('.main-nav > a').first();
  const before = await link.boundingBox();
  await link.hover();
  await page.waitForTimeout(240);
  const active = await link.evaluate(element => ({
    pillOpacity: getComputedStyle(element, '::before').opacity,
    pillDuration: getComputedStyle(element, '::before').transitionDuration,
    textDuration: getComputedStyle(element.querySelector('.roll-text-layer')).transitionDuration,
    textDelay: getComputedStyle(element.querySelector('.roll-text-layer')).transitionDelay,
    settleAnimation: getComputedStyle(element.querySelector('.roll-layer-content')).animationName,
  }));
  expect(active).toEqual({ pillOpacity: '1', pillDuration: '0.22s', textDuration: '0.22s', textDelay: '0s', settleAnimation: 'none' });
  expect(await link.boundingBox()).toEqual(before);
  await page.locator('.hero').hover();
  await page.waitForTimeout(240);
  await expect(link.locator('.roll-text-layer').first()).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await link.focus();
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS('outline-style', 'solid');
});

test('mobile navbar retains lifecycle in the refined panel', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await signedOut(page);
  for (const width of [320, 700, 701, 1199]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const toggle = page.locator('.menu-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveCSS('width', '38px');
    await expect(toggle).toHaveCSS('height', '38px');
    await toggle.click();
    const panel = page.locator('.main-nav');
    await expect(panel).toBeVisible();
    const values = await panel.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const row = element.querySelector(':scope > a').getBoundingClientRect();
      return { x: bounds.x, width: bounds.width, y: bounds.y, rowHeight: row.height, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(values.x).toBeCloseTo(15, 0);
    expect(values.width).toBeCloseTo(width - 30, 0);
    expect(values.y).toBe(70);
    expect(values.rowHeight).toBe(48);
    expect(values.overflow).toBe(0);
    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible();
    await expect(toggle).toBeFocused();
  }
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(page.locator('.menu-toggle')).not.toBeVisible();
  await expect(page.locator('.main-nav')).toBeVisible();
});

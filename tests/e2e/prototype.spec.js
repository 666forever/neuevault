import { expect, test } from '@playwright/test';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

test('mobile navigation keeps the compact primary order and sign-in reachable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/'); await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('.mobile-nav-actions .collections-button')).toHaveCount(0);
  expect(await page.locator('.main-nav > a').evaluateAll(links => links.map(link => link.querySelector('.roll-text-layer:first-child')?.textContent.trim()))).toEqual(['Icons', 'Banners', 'Wallpapers', 'Collections']);
  await expect(page.getByRole('button', { name: 'Sign In' }).last()).toBeVisible();
});

test('collapsed navigation owns dismissal, focus, route, and breakpoint state', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.goto('/');
  const toggle = page.locator('.menu-toggle'); const panel = page.locator('.main-nav');
  await expect(toggle).toHaveAccessibleName('Open menu'); await expect(toggle).toHaveAttribute('aria-expanded', 'false'); await expect(toggle).toHaveAttribute('aria-controls', 'main-nav');
  await expect(panel).not.toBeVisible(); await expect(panel.locator('a').first()).not.toBeVisible();

  await toggle.focus(); await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.querySelector('.main-nav').contains(document.activeElement))).toBe(false);
  await toggle.click(); await expect(toggle).toHaveAccessibleName('Close menu'); await expect(toggle).toHaveAttribute('aria-expanded', 'true'); await expect(panel).toBeVisible();
  await toggle.focus(); await page.keyboard.press('Tab'); await expect(panel.locator('a').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(toggle).toBeFocused();

  await panel.dispatchEvent('pointerdown'); await expect(panel).toHaveClass(/open/);
  const beforeEscape = page.url(); await page.keyboard.press('Escape');
  await expect(panel).not.toHaveClass(/open/); await expect(toggle).toBeFocused(); expect(page.url()).toBe(beforeEscape);

  await toggle.click(); await page.locator('.hero').click({ position: { x: 5, y: 5 } });
  await expect(panel).not.toHaveClass(/open/); await expect(toggle).not.toBeFocused(); await expect(page).toHaveURL(beforeEscape);

  await toggle.click();
  await panel.locator('a[href="/collections"]').evaluate(element => element.addEventListener('click', event => event.preventDefault(), { once: true }));
  await panel.locator('a[href="/collections"]').click(); await expect(panel).toHaveClass(/open/); await expect(page).toHaveURL(beforeEscape);
  await panel.locator('a[href="/collections"]').click(); await expect(page).toHaveURL(/\/collections$/);
  await expect(panel).not.toHaveClass(/open/); await expect(toggle).toHaveAttribute('aria-expanded', 'false'); await expect(toggle).not.toBeFocused();
  await expect(page.locator('.site-header [aria-current="page"]')).toHaveCount(1); await expect(panel.locator('[data-nav="collections"]')).toHaveAttribute('aria-current', 'page');
  await page.goBack(); await expect(page).toHaveURL(/\/$/); await expect(panel).not.toHaveClass(/open/);

  await page.setViewportSize({ width: 1199, height: 900 }); await toggle.click(); await expect(panel).toHaveClass(/open/);
  await page.setViewportSize({ width: 1200, height: 900 }); await expect(panel).not.toHaveClass(/open/); await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({ width: 1199, height: 900 }); await expect(panel).not.toHaveClass(/open/); await expect(toggle).toHaveAccessibleName('Open menu');

  await toggle.click(); await panel.locator('.sign-in-mobile').click(); await expect(page.locator('#auth-dialog')).toBeVisible(); await expect(panel).not.toHaveClass(/open/);
  await page.keyboard.press('Escape'); await expect(page.locator('#auth-dialog')).toBeHidden(); await expect(panel).not.toHaveClass(/open/);
});

test('registry icons preserve control names, state, and geometry', async ({ page }, testInfo) => {
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.goto('/');
  const menu = page.locator('.menu-toggle');
  if (testInfo.project.name === 'mobile') {
    await expect(menu.locator('svg.icon')).toHaveCount(1);
    await expect(menu.locator('svg.icon')).toHaveAttribute('aria-hidden', 'true');
    const before = await menu.boundingBox();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-label', 'Close menu');
    await expect(menu.locator('svg.icon')).toHaveCount(1);
    const after = await menu.boundingBox();
    expect({ width: after.width, height: after.height }).toEqual({ width: before.width, height: before.height });
  }

  const heroCta = page.locator('.hero-category-cta');
  await expect(heroCta.locator('.roll-icon svg.icon')).toHaveCount(2);
  await expect(heroCta).toHaveAccessibleName(/^(Banners|Icons)$/);
  await page.locator('.asset-card').first().click();
  for (const [name, selector] of [
    ['Close viewer', '.modal-close'],
    ['Previous asset', '.modal-nav.prev'],
    ['Next asset', '.modal-nav.next'],
  ]) {
    const control = page.locator(selector);
    await expect(control).toHaveAccessibleName(name);
    await expect(control.locator('svg.icon')).toHaveCount(1);
    await expect(control.locator('svg.icon')).toHaveAttribute('aria-hidden', 'true');
  }
  await expect(page.getByRole('button', { name: 'Copy link', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Download original', exact: true })).toHaveCount(1);
  await expect(page.locator('.share-action .roll-icon svg.icon')).toHaveCount(2);
  await expect(page.locator('.download-action .roll-icon svg.icon')).toHaveCount(2);
});

test('icon-and-text buttons fade a variant-owned outside border without geometry change', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.goto('/');
  const hero = page.locator('.hero-category-cta');
  const signIn = page.locator('.sign-in');
  for (const control of [hero, signIn]) {
    await expect(control).toHaveClass(/button-with-icon/);
    const before = await control.boundingBox();
    const rest = await control.evaluate(element => {
      const style = getComputedStyle(element, '::after');
      return { width: style.borderTopWidth, color: style.borderTopColor, opacity: style.opacity, duration: style.transitionDuration, easing: style.transitionTimingFunction, radius: style.borderRadius, inset: [style.top, style.right, style.bottom, style.left], overflow: getComputedStyle(element.parentElement).overflow };
    });
    expect(rest).toMatchObject({ width: '3px', opacity: '0', duration: '0.2s', easing: 'cubic-bezier(0.76, 0, 0.24, 1)' });
    expect(rest.color).toMatch(/(?:0\.2\)|\/ 0\.2\))/);
    expect(rest.inset).toEqual(['-3px', '-3px', '-3px', '-3px']);
    expect(rest.overflow).not.toBe('hidden');
    expect(rest.radius).toBe(await control.evaluate(element => getComputedStyle(element).borderRadius));
    await control.hover();
    await expect.poll(() => control.evaluate(element => getComputedStyle(element, '::after').opacity)).toBe('1');
    const after = await control.boundingBox();
    expect({ width: after.width, height: after.height }).toEqual({ width: before.width, height: before.height });
    await page.locator('.hero h1').hover();
    await expect.poll(() => control.evaluate(element => getComputedStyle(element, '::after').opacity)).toBe('0');
    await control.focus();
    await expect(control).toHaveCSS('outline-style', 'solid');
    await expect.poll(() => control.evaluate(element => getComputedStyle(element, '::after').opacity)).toBe('1');
  }
  await expect(page.locator('.collection-section .section-head-action')).not.toHaveClass(/button-with-icon/);
  await expect(page.locator('.load-more')).not.toHaveClass(/button-with-icon/);
  await expect(page.locator('.menu-toggle')).not.toHaveClass(/button-with-icon/);
});

test('hero category action preserves its compact reference geometry', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  for (const width of [320, 375, 700, 1200, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 700 ? 820 : 900 });
    await page.goto('/');
    const measurement = await page.locator('.hero-category-cta').evaluate(element => {
      const cta = element.getBoundingClientRect();
      return {
        cta: { width: cta.width, height: cta.height },
        radius: getComputedStyle(element).borderRadius,
      };
    });
    expect(measurement.cta.height).toBe(40);
    expect(measurement.cta.width).toBeGreaterThan(80);
    expect(measurement.radius).toBe('4px');
  }
});

test('homepage navbar branding and split hero preserve routes and exact copy', async ({ page }) => {
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.goto('/');
  const logo = page.locator('.site-header .profile-brand-logo');
  await expect(logo).toBeVisible();
  await expect(logo).toHaveCSS('width', '27px');
  await expect(logo).toHaveCSS('height', '30px');
  await expect(logo).toHaveCSS('background-color', 'rgb(255, 16, 80)');
  const navbarBrand = page.locator('.site-header .profile-brand');
  await expect(navbarBrand).toHaveAccessibleName('Profileseeker.com home');
  await expect(navbarBrand.locator('.profile-brand-logo')).toHaveCount(1);
  await expect(navbarBrand.locator('.roll-text-layer')).toHaveCount(2);
  await expect(navbarBrand.locator('.roll-text-layer').first()).toHaveText('Profileseeker.com');
  await expect(navbarBrand.locator('.profile-brand-strong')).toHaveCount(2);
  await expect(navbarBrand.locator('.profile-brand-medium')).toHaveCount(2);
  await expect(navbarBrand.locator('.profile-brand-strong').first()).toHaveCSS('font-weight', '700');
  await expect(navbarBrand.locator('.profile-brand-strong').last()).toHaveCSS('font-weight', '700');
  await expect(navbarBrand.locator('.profile-brand-medium').first()).toHaveCSS('font-weight', '500');
  await expect(navbarBrand.locator('.profile-brand-medium').last()).toHaveCSS('font-weight', '500');
  expect(await navbarBrand.locator('.roll-text-layer').first().evaluate(layer => {
    const strong = layer.querySelector('.profile-brand-strong').getBoundingClientRect();
    const medium = layer.querySelector('.profile-brand-medium').getBoundingClientRect();
    return Math.abs(strong.right - medium.left) < 1;
  })).toBe(true);
  await expect(page.locator('.collections-button')).toHaveCount(0);
  await expect(page.locator('.hero-eyebrow')).toHaveText('pfseeker ©');
  await expect(page.locator('.hero-eyebrow')).toHaveCSS('font-family', /Helvetica Now Var/);
  await expect(page.locator('.hero h1 > span').first()).toHaveText('Probably the Best');
  await expect(page.locator('.hero h1 > span').nth(1)).toHaveText(/^(Banners|Icons) on the Internet\.$/);
  await expect(page.locator('.hero h1')).toHaveCSS('font-family', /SF Pro/);
  await expect(page.locator('.hero h1')).toHaveCSS('font-weight', '600');
  await expect(page.locator('.hero-sign-in')).toHaveCount(0);
  await expect(page.locator('.hero-actions > .button')).toHaveCount(2);
  const browse = page.locator('.hero-category-cta');
  const selectedHeroWord = (await page.locator('.hero h1 > span').nth(1).textContent()).split(' ')[0];
  await expect(browse).toHaveAccessibleName(selectedHeroWord);
  await expect(browse).toHaveAttribute('href', `/${selectedHeroWord.toLowerCase()}`);
  await expect(browse).toHaveCSS('background-color', 'rgb(255, 16, 80)');
  await expect(browse.locator('svg').first()).toHaveCSS('color', 'rgb(245, 245, 242)');
  const collectionsCta = page.locator('.hero-collections-cta');
  await expect(collectionsCta).toHaveAccessibleName('Collections');
  await expect(collectionsCta).toHaveAttribute('href', '/collections');
  await expect(collectionsCta).toHaveCSS('background-color', 'rgb(245, 245, 242)');
  await expect(collectionsCta).toHaveCSS('color', 'rgb(29, 29, 32)');
  await expect(collectionsCta.locator('svg').first()).toHaveCSS('color', 'rgb(255, 16, 80)');
  const description = page.locator('.hero-description');
  expect((await description.textContent()).replace(/\s+/g, ' ').trim()).toBe('Start digging through alt, emo, dark, soft, strange, cute, messy, and more in the spaces where they all cross. Your identity forms in this borderland.');
  await expect(description).toHaveCSS('font-family', /SF Pro Rounded/);
  await expect(description).toHaveCSS('font-weight', '400');
  await expect(page.locator('.hero-media, .hero-gradient, .hero-decorations')).toHaveCount(0);
  await browse.click(); await expect(page).toHaveURL(new RegExp(`/${selectedHeroWord.toLowerCase()}$`));
  await page.goto('/recent');
  await expect(page.locator('.hero')).toHaveCount(0);
});

test('approved local fonts load without italic or legacy fallbacks', async ({ page }) => {
  const fontResponses = [];
  page.on('response', response => { if (response.url().includes('/fonts/')) fontResponses.push({ url: response.url(), status: response.status(), type: response.headers()['content-type'] || '' }); });
  await page.goto('/'); await page.evaluate(() => document.fonts.ready);
  for (const file of ['SF-Pro-Rounded-Medium.woff2', 'SF-Pro.woff2', 'SF-Pro-Display-Medium.woff2', 'SF-Pro-Display-Bold.woff2', 'HelveticaNowVar.woff2']) {
    const response = fontResponses.find(item => item.url.endsWith(file));
    expect(response).toBeTruthy(); expect(response.status).toBe(200); expect(response.type).toContain('font/woff2');
  }
  expect(fontResponses.some(item => item.url.includes('Italic-VariableFont'))).toBe(false);
  expect(fontResponses.some(item => /Arimo|Archivo|Inter/.test(item.url))).toBe(false);
  expect(await page.locator('.site-header .profile-brand-wordmark').evaluate(element => getComputedStyle(element).fontFamily)).toContain('SF Pro Display');
  expect(await page.locator('.hero h1').evaluate(element => getComputedStyle(element).fontFamily)).toContain('SF Pro');
});

test('split hero does not request the retired hero media', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 1920, height: 1080 });
  const requests = [];
  page.on('request', request => { if (/sailor_hero-|heroimage\.png|hero(?:new)?\.(?:gif|mp4)|furina-hero-/.test(request.url())) requests.push(request.url()); });
  await page.goto('/');
  await page.waitForTimeout(400);
  expect(requests).toEqual([]);
});

test('hero keeps the requested deliberate desktop line structure', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  const titleLines = page.locator('.hero h1 > span');
  const descriptionLines = page.locator('.hero-description > span');
  await expect(titleLines).toHaveCount(2);
  await expect(titleLines.first()).toHaveText('Probably the Best');
  await expect(titleLines.nth(1)).toHaveText(/^(Banners|Icons) on the Internet\.$/);
  await expect(descriptionLines).toHaveCount(3);
  await expect(descriptionLines).toHaveText([
    'Start digging through alt, emo, dark, soft, strange, cute, messy, and more',
    'in the spaces where they all cross. Your identity forms in this',
    'borderland.',
  ]);
  await expect(descriptionLines.first()).toHaveCSS('display', 'block');
  const descriptionBoxes = await descriptionLines.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top));
  expect(descriptionBoxes[1]).toBeGreaterThan(descriptionBoxes[0]);
  expect(descriptionBoxes[2]).toBeGreaterThan(descriptionBoxes[1]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('hero shares the 1440px public container and keeps its selected word stable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const secondLine = page.locator('.hero h1 > span').nth(1);
  const selected = await secondLine.textContent();
  await page.locator('.hero-category-cta').hover();
  await page.waitForTimeout(100);
  await expect(secondLine).toHaveText(selected);
  expect(await page.locator('.hero-layout').evaluate(element => {
    const box = element.getBoundingClientRect();
    return { width: box.width, left: box.left, right: window.innerWidth - box.right };
  })).toEqual({ width: 1440, left: 240, right: 240 });
});

for (const width of [320, 375, 700, 701, 1023, 1024, 1200, 1440, 1920]) {
  test(`split hero remains bounded at ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop');
    await page.setViewportSize({ width, height: width <= 700 ? 780 : 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.locator('.hero').evaluate(hero => {
      const title = hero.querySelector('h1').getBoundingClientRect();
      const heroBox = hero.getBoundingClientRect();
      const layout = hero.querySelector('.hero-layout');
      const secondLine = hero.querySelector('h1 > span:last-child');
      const lineHeight = Number.parseFloat(getComputedStyle(secondLine).lineHeight);
      return { bounded: title.left >= heroBox.left - 1 && title.right <= heroBox.right + 1, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, columns: getComputedStyle(layout).gridTemplateColumns.split(' ').length, secondLineRows: Math.round(secondLine.getBoundingClientRect().height / lineHeight) };
    })).toEqual({ bounded: true, overflow: false, columns: width < 1024 ? 1 : 5, secondLineRows: width < 1440 ? expect.any(Number) : 1 });
  });
}

test('signed-out copy stays compact while the Discord OAuth action remains explicit', async ({ page }, testInfo) => {
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.route('**/api/auth/discord**', route => route.fulfill({ status: 204 }));
  await page.goto('/');
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  const signIn = page.locator('.sign-in:visible, .sign-in-mobile:visible');
  await expect(signIn.locator('.roll-text-layer').first()).toHaveText('Sign In');
  await expect(signIn).toHaveAttribute('aria-label', 'Sign in with Discord');
  await signIn.click();
  await expect(page.locator('.auth-dialog-card')).toBeVisible();
  const oauthRequest = page.waitForRequest(request => new URL(request.url()).pathname === '/api/auth/discord');
  await page.locator('.auth-continue').click();
  expect(await oauthRequest).toBeTruthy();
});

test('reduced motion keeps both split-hero actions visible and usable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero-category-cta')).toBeVisible();
  await expect(page.locator('.hero-collections-cta')).toBeVisible();
  await expect(page.locator('.hero-media')).toHaveCount(0);
});

test('split hero remains stable across refresh, viewport, and route changes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.setViewportSize({ width: 1440, height: 900 });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt === 0) await page.goto('/'); else await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.hero-layout')).toHaveCount(1);
    await expect(page.locator('.hero h1 > span').nth(1)).toHaveText(/^(Banners|Icons) on the Internet\.$/);
  }
  await page.setViewportSize({ width: 375, height: 780 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hero-layout')).toHaveCSS('grid-template-columns', /.+/);
  await page.goto('/about'); await expect(page.locator('.hero')).toHaveCount(0);
  await page.goto('/'); await expect(page.locator('.hero-layout')).toHaveCount(1);
});

test('navbar and hero remain bounded across target responsive widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  for (const width of [320, 375, 700, 701, 1199, 1200, 1440, 1600, 1920]) {
    await page.setViewportSize({ width, height: width < 700 ? 780 : 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator('.site-header .profile-brand-wordmark')).toBeVisible();
    await expect(page.locator('.hero h1')).toBeVisible();
    if (width < 1024) await expect(page.locator('.hero h1')).toHaveCSS('font-size', '36px');
    const heroBox = await page.locator('.hero').boundingBox();
    const titleBox = await page.locator('.hero h1').boundingBox();
    const descriptionBox = await page.locator('.hero-description').boundingBox();
    const firstCtaBox = await page.locator('.hero-category-cta').boundingBox();
    expect(titleBox.x).toBeGreaterThanOrEqual(heroBox.x);
    expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(heroBox.x + heroBox.width + 1);
    expect(firstCtaBox.y).toBeGreaterThan(descriptionBox.y + descriptionBox.height);
    expect(firstCtaBox.y + firstCtaBox.height).toBeLessThanOrEqual(heroBox.y + heroBox.height + 1);
    await expect(page.locator('.hero-category-cta')).toHaveCSS('border-radius', '4px');
    await expect(page.locator('.hero-description')).toHaveCSS('font-size', width < 1024 ? '18px' : '17px');
    await expect(page.locator('.hero-eyebrow')).toBeVisible();
    if (width < 1200) {
      const toggle = page.getByRole('button', { name: 'Open menu' });
      await expect(toggle).toBeVisible(); await toggle.click();
      await expect(page.locator('.main-nav')).toHaveClass(/open/);
      await expect(page.locator('.mobile-nav-actions .sign-in-mobile')).toBeVisible();
      await expect(page.locator('.mobile-nav-actions .collections-button')).toHaveCount(0);
      await expect(page.locator('.sign-in-mobile')).toHaveCSS('border-radius', '4px');
      await expect(page.locator('.sign-in-mobile .roll-text-layer').first()).toHaveText('Sign In');
    } else {
      await expect(page.locator('.main-nav')).toBeVisible();
      await expect(page.locator('.nav-actions .sign-in')).toBeVisible();
      await expect(page.locator('.nav-actions .collections-button')).toHaveCount(0);
      await expect(page.locator('.sign-in')).toHaveCSS('border-radius', '4px');
      await expect(page.locator('.sign-in .roll-text-layer').first()).toHaveText('Sign In');
    }
  }
});

test('rolling controls preserve geometry, accessible names, and opposite icon motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.goto('/');
  const nav = page.locator('.main-nav > a').first(); const signIn = page.locator('.sign-in'); const hero = page.locator('.hero-category-cta');
  for (const control of [nav, signIn, hero]) {
    await expect(control).toHaveClass(/has-roll-animation/);
    await expect(control.locator('.roll-text-layer')).toHaveCount(2);
    await expect(control.locator('.roll-text-layer').last()).toHaveAttribute('aria-hidden', 'true');
  }
  await expect(page.getByRole('button', { name: 'Sign in with Discord', exact: true })).toHaveCount(1);
  await expect(nav.locator('.roll-icon-layer')).toHaveCount(0);
  await expect(signIn.locator('.roll-icon-layer')).toHaveCount(2);
  const gapBefore = await page.locator('.main-nav').evaluate(element => getComputedStyle(element).gap);
  const navBefore = await nav.boundingBox();
  const navRest = await nav.evaluate(element => ({
    incomingText: getComputedStyle(element.querySelector('.roll-text-layer:last-child')).transform,
    incomingOrigin: getComputedStyle(element.querySelector('.roll-text-layer:last-child')).transformOrigin,
    pillHeight: getComputedStyle(element, '::before').height,
    pillBackground: getComputedStyle(element, '::before').backgroundColor,
    pillDuration: getComputedStyle(element, '::before').transitionDuration,
    pillTiming: getComputedStyle(element, '::before').transitionTimingFunction,
  }));
  expect(navRest.incomingText).toContain('-30');
  expect(navRest.incomingOrigin).not.toBe('50% 50%');
  expect(navRest.pillHeight).toBe('40px');
  expect(navRest.pillBackground).toBe('rgb(30, 30, 30)');
  expect(navRest.pillDuration).toBe('0.44s');
  expect(navRest.pillTiming).toBe('cubic-bezier(0.54, 1.5, 0.24, 1)');
  const before = await signIn.boundingBox();
  await signIn.hover();
  await expect(signIn.locator('.roll-text-layer').first()).toHaveCSS('transition-delay', '0s');
  await expect(signIn.locator('.roll-text-layer').last().locator('.roll-layer-content')).toHaveCSS('animation-name', 'none');
  await expect(signIn.locator('.roll-icon-layer').last().locator('.roll-layer-content')).toHaveCSS('animation-name', 'none');
  await expect(signIn).toHaveCSS('transform', 'none');
  await page.waitForTimeout(480);
  const motion = await signIn.evaluate(element => ({ text: getComputedStyle(element.querySelector('.roll-text-layer')).transform, icon: getComputedStyle(element.querySelector('.roll-icon-layer')).transform, incomingText: getComputedStyle(element.querySelector('.roll-text-layer:last-child')).transform, incomingIcon: getComputedStyle(element.querySelector('.roll-icon-layer:last-child')).transform }));
  expect(motion.text).toContain('30'); expect(motion.icon).toContain('-30'); expect(motion.incomingText).toBe('matrix(1, 0, 0, 1, 0, 0)'); expect(motion.incomingIcon).toBe('matrix(1, 0, 0, 1, 0, 0)');
  const after = await signIn.boundingBox(); expect({ width: after.width, height: after.height }).toEqual({ width: before.width, height: before.height });
  await nav.hover();
  await expect(nav.locator('.roll-text-layer').first()).toHaveCSS('transition-delay', '0s');
  await page.waitForTimeout(480);
  expect(await nav.evaluate(element => getComputedStyle(element.querySelector('.roll-text-layer:first-child')).transform)).toContain('30');
  const navAfter = await nav.boundingBox();
  expect({ width: navAfter.width, height: navAfter.height }).toEqual({ width: navBefore.width, height: navBefore.height });
  expect(await page.locator('.main-nav').evaluate(element => getComputedStyle(element).gap)).toBe(gapBefore);
  await page.locator('.hero').hover();
  await expect(signIn.locator('.roll-text-layer').first()).toHaveCSS('transition-delay', '0s');
  await nav.focus(); await expect(nav.locator('.roll-text-layer').first()).toHaveCSS('transition-delay', '0s');
  expect(await nav.evaluate(element => getComputedStyle(element, '::before').transitionDelay)).toBe('0s');
});

test('rolling controls keep text and paired icons visible throughout pointer exit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.goto('/');
  const control = page.locator('.sign-in');
  await control.hover(); await page.waitForTimeout(480);
  const shellBefore = await control.boundingBox();
  await page.locator('.hero').hover();
  const samples = [];
  for (const delay of [0, 80, 160, 190]) {
    if (delay) await page.waitForTimeout(delay);
    samples.push(await control.evaluate(element => {
      const intersects = (viewport, selector) => {
        const frame = viewport.getBoundingClientRect();
        return [...viewport.querySelectorAll(selector)].some(layer => {
          const rect = layer.getBoundingClientRect();
          return rect.bottom > frame.top && rect.top < frame.bottom;
        });
      };
      const textViewport = element.querySelector('.roll-text');
      const iconViewport = element.querySelector('.roll-icon');
      return {
        textVisible: intersects(textViewport, '.roll-text-layer'),
        iconVisible: intersects(iconViewport, '.roll-icon-layer'),
        delay: getComputedStyle(element.querySelector('.roll-text-layer')).transitionDelay,
        textAnimation: getComputedStyle(element.querySelector('.roll-text-layer:last-child .roll-layer-content')).animationName,
      };
    }));
  }
  expect(samples.every(sample => sample.textVisible && sample.iconVisible)).toBe(true);
  expect(samples.every(sample => sample.delay === '0s')).toBe(true);
  expect(samples.every(sample => sample.textAnimation === 'none')).toBe(true);
  await page.waitForTimeout(30);
  const final = await control.evaluate(element => ({
    textPrimary: getComputedStyle(element.querySelector('.roll-text-layer:first-child')).transform,
    textDuplicate: getComputedStyle(element.querySelector('.roll-text-layer:last-child')).transform,
    iconPrimary: getComputedStyle(element.querySelector('.roll-icon-layer:first-child')).transform,
    iconDuplicate: getComputedStyle(element.querySelector('.roll-icon-layer:last-child')).transform,
  }));
  expect(final).toEqual({ textPrimary: 'matrix(1, 0, 0, 1, 0, 0)', textDuplicate: 'matrix(1, 0, 0, 1, 0, -30)', iconPrimary: 'matrix(1, 0, 0, 1, 0, 0)', iconDuplicate: 'matrix(1, 0, 0, 1, 0, 30)' });
  const shellAfter = await control.boundingBox();
  expect({ width: shellAfter.width, height: shellAfter.height }).toEqual({ width: shellBefore.width, height: shellBefore.height });
  const nav = page.locator('.main-nav > a').first();
  await nav.hover(); await page.waitForTimeout(480);
  await page.locator('.hero').hover();
  const pillStart = Number(await nav.evaluate(element => getComputedStyle(element, '::before').opacity));
  await page.waitForTimeout(480);
  const pillEnd = Number(await nav.evaluate(element => getComputedStyle(element, '::before').opacity));
  expect(pillStart).toBeGreaterThan(pillEnd);
  expect(pillEnd).toBe(0);
});

test('rolling controls and Lenis remain enhancement-only for touch and reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  const hero = page.locator('.hero-category-cta');
  await expect(hero.locator('.roll-text-layer').last()).toHaveCSS('visibility', 'hidden');
  expect(await page.locator('.main-nav > a').first().evaluate(element => getComputedStyle(element, '::before').transitionDuration)).toBe('0s');
  if (testInfo.project.name === 'mobile') {
    const href = await hero.getAttribute('href');
    await hero.tap(); await expect(page).toHaveURL(new RegExp(`${href}$`));
  }
});

test('Lenis pauses for dialogs while modal panels retain native scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop'); await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(200);
  const originalScroll = await page.evaluate(() => scrollY); expect(originalScroll).toBeGreaterThan(0);
  await page.locator('.site-footer a[href="/about"]').evaluate(element => element.click()); await expect(page).toHaveURL(/\/about$/); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goBack(); await expect(page).toHaveURL(/\/$/); await page.waitForTimeout(300); expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page.locator('.asset-card').first().click();
  const modalScroll = await page.evaluate(() => scrollY);
  await expect(page.locator('body')).toHaveClass(/modal-open/);
  await expect(page.locator('html')).toHaveClass(/lenis-stopped/);
  await expect(page.locator('.modal-info')).toHaveAttribute('data-lenis-prevent', '');
  await page.locator('.modal-close').click();
  await expect(page.locator('body')).not.toHaveClass(/modal-open/);
  await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
  expect(await page.evaluate(() => scrollY)).toBe(modalScroll);
});

test('modal keyboard steps and restores the opening card focus', async ({ page }) => {
  await page.goto('/'); const first = page.locator('.asset-card').first(); await first.focus(); await first.click();
  await expect(page).toHaveURL(/\/asset\/nv-\d+\//);
  const initial = await page.locator('#modal-title').textContent(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#modal-title')).not.toHaveText(initial); await page.keyboard.press('Escape'); await expect(page).toHaveURL('/'); await expect(first).toBeFocused();
  await page.goForward(); await expect(page.locator('#asset-modal')).toBeVisible();
});

test('asset modal and auth surfaces preserve aligned geometry and accessible containment', async ({ page }, testInfo) => {
  await page.route('**/api/auth/session*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}',
  }));
  await page.goto('/asset/nv-147/5668aab8202896db0fc468ea0dc6b7a3');
  const shell = page.locator('.modal-shell');
  const preview = page.locator('.modal-preview');
  const info = page.locator('.modal-info');
  await expect(shell).toBeVisible();
  await expect(info).toHaveAttribute('data-lenis-prevent', '');
  await expect(page.getByRole('button', { name: 'Close viewer' })).toBeFocused();
  await expect(page.locator('.modal-actions .button')).toHaveCount(2);
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeFocused();
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.locator('#toast')).not.toHaveText('');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close viewer' })).toBeFocused();

  const geometry = await page.evaluate(() => {
    const box = selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { width: rect.width, height: rect.height, x: rect.x, y: rect.y };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      shell: box('.modal-shell'),
      preview: box('.modal-preview'),
      info: box('.modal-info'),
      close: box('.modal-close'),
      prev: box('.modal-nav.prev'),
      next: box('.modal-nav.next'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(geometry.overflow).toBeLessThanOrEqual(0);
  expect(geometry.close).toMatchObject({ width: 40, height: 40 });
  expect(geometry.prev).toMatchObject({ width: 40, height: 40 });
  expect(geometry.next).toMatchObject({ width: 40, height: 40 });

  if (testInfo.project.name === 'desktop') {
    expect(geometry.shell.width).toBeCloseTo(1180, 0);
    expect(geometry.shell.height).toBeCloseTo(Math.min(820, geometry.viewport.height * 0.94), 0);
    expect(geometry.info.width).toBeCloseTo(380, 0);
    expect(geometry.preview.width).toBeCloseTo(798, 0);
  } else {
    expect(geometry.shell.width).toBeCloseTo(geometry.viewport.width, 0);
    expect(geometry.shell.height).toBeCloseTo(geometry.viewport.height, 0);
    expect(geometry.info.width).toBeCloseTo(geometry.viewport.width, 0);
    expect(geometry.preview.height).toBeLessThanOrEqual(420);
  }

  await page.getByRole('button', { name: 'Close viewer' }).click();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'Sign in with Discord' }).last().click();
  const authCard = page.locator('.auth-dialog-card');
  await expect(authCard).toBeVisible();
  await expect(authCard).toHaveAttribute('data-lenis-prevent', '');
  await expect(page.getByRole('button', { name: 'Close sign-in dialog' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close sign-in dialog' })).toBeFocused();
  const authGeometry = await authCard.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const close = element.querySelector('.auth-close').getBoundingClientRect();
    return { width: rect.width, height: rect.height, closeWidth: close.width, closeHeight: close.height };
  });
  expect(authGeometry.width).toBeLessThanOrEqual(440);
  expect(authGeometry.closeWidth).toBe(40);
  expect(authGeometry.closeHeight).toBe(40);
});

test('modal long metadata and failed preview remain contained without a broken-image glyph', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const manifest = JSON.parse(await readFile(path.resolve('src/generated/assets.json'), 'utf8'));
  const asset = manifest.find(item => item.id === 'nv-147');
  await page.route('**/nv-147.jpg', route => route.abort());
  await page.goto(`/asset/${asset.id}/${asset.slug}`);
  await expect(page.locator('.modal-preview')).toHaveClass(/image-error/);
  await expect(page.locator('.modal-preview img')).toHaveCount(0);
  await page.locator('.meta-row dd').first().evaluate(element => {
    element.textContent = 'A deliberately long metadata value that validates natural wrapping without changing production data or modal behavior';
  });
  const containment = await page.evaluate(() => {
    const shell = document.querySelector('.modal-shell').getBoundingClientRect();
    const info = document.querySelector('.modal-info').getBoundingClientRect();
    return {
      shellWidth: shell.width,
      infoWidth: info.width,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      valueOverflow: document.querySelector('.meta-row dd').scrollWidth - document.querySelector('.meta-row dd').clientWidth,
    };
  });
  expect(containment.shellWidth).toBeLessThanOrEqual(1180);
  expect(containment.infoWidth).toBeLessThanOrEqual(380);
  expect(containment.overflow).toBeLessThanOrEqual(0);
  expect(containment.valueOverflow).toBeLessThanOrEqual(0);
});

test('clean routes, active navigation, deep links, and legacy migration work', async ({ page, request }) => {
  await page.goto('/'); await expect(page.locator('.site-header .brand')).toHaveAttribute('aria-current', 'page'); await expect(page.locator('.site-header [aria-current="page"]')).toHaveCount(1);
  for (const pathName of ['/icons', '/banners', '/wallpapers', '/collections']) {
    const response = await request.get(pathName); expect(response.status()).toBe(200);
    await page.goto(pathName); await expect(page.locator(`.main-nav [data-nav="${pathName.slice(1)}"]`)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.site-header [aria-current="page"]')).toHaveCount(1);
  }
  for (const pathName of ['/recent', '/animated', '/search', '/about']) {
    const response = await request.get(pathName); expect(response.status()).toBe(200);
    await page.goto(pathName); await expect(page.locator('.site-header [aria-current="page"]')).toHaveCount(0);
  }
  await page.goto('/collections');
  const activeNav = page.locator('.main-nav [data-nav="collections"]');
  await expect(activeNav).toHaveCSS('color', 'rgb(245, 245, 242)');
  await expect.poll(() => activeNav.evaluate(element => getComputedStyle(element, '::before').opacity)).toBe('1');
  expect(await activeNav.evaluate(element => getComputedStyle(element).textDecorationLine)).toBe('none');
  await page.goto('/#/search?type=Banners'); await expect(page).toHaveURL('/banners');
  const manifest = JSON.parse(await readFile(path.resolve('src/generated/assets.json'), 'utf8')); const asset = manifest.find(item => item.category === 'Banners');
  await page.goto(`/asset/${asset.id}/${asset.slug}`); await expect(page.locator('#modal-title')).toHaveText(asset.title);
  await expect(page.locator('.main-nav [data-nav="banners"]')).toHaveAttribute('aria-current', 'page');
  await page.reload(); await expect(page.locator('#modal-title')).toHaveText(asset.title);
  await page.goto('/asset/not-a-real-id/missing'); await expect(page.getByRole('heading', { name: 'Nothing here.' })).toBeVisible();
  expect(await page.locator('.main-nav a').evaluateAll(links => links.every(link => !link.getAttribute('href').includes('#/')))).toBe(true);
});

test('Search controls preserve bounded geometry, native semantics, and accessible filter state', async ({ page }, testInfo) => {
  await page.goto('/search?q=icon&type=Icons');
  const search = page.getByRole('search');
  const input = page.getByRole('searchbox', { name: 'Search assets' });
  const select = page.getByRole('combobox', { name: 'Filter by access' });
  const active = page.getByRole('button', { name: 'Icons', exact: true });
  await expect(search).toBeVisible();
  await expect(input).toHaveValue('icon');
  await expect(select).toHaveValue('all');
  await expect(active).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.filter[aria-pressed="true"]')).toHaveCount(1);
  const geometry = await page.evaluate(() => {
    const box = selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      const style = getComputedStyle(document.querySelector(selector));
      return { width: rect.width, height: rect.height, radius: style.borderRadius, padding: style.padding };
    };
    return {
      content: box('.search-content'),
      input: box('.search-input'),
      select: box('.select'),
      filter: box('.filter'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(geometry.content.width).toBeLessThanOrEqual(1180);
  expect(geometry.input.height).toBe(42);
  expect(geometry.select.height).toBe(42);
  expect(geometry.filter.height).toBe(36);
  expect(geometry.input.radius).toBe('999px');
  expect(geometry.overflow).toBeLessThanOrEqual(0);
  if (testInfo.project.name === 'mobile') {
    expect(geometry.input.width).toBeCloseTo(geometry.content.width, 0);
    expect(geometry.select.width).toBeCloseTo(geometry.content.width, 0);
  }

  await page.getByRole('button', { name: 'Banners', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Banners', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(active).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.filter[aria-pressed="true"]')).toHaveCount(1);
});

test('Search state, empty presentation, and modal history preserve the existing URL contract', async ({ page }) => {
  await page.goto('/search?q=icon&type=Icons');
  const originalUrl = page.url();
  await page.getByRole('searchbox', { name: 'Search assets' }).fill('banner');
  await page.waitForTimeout(220);
  await page.getByRole('combobox', { name: 'Filter by access' }).selectOption('public');
  await page.getByRole('button', { name: 'Banners', exact: true }).click();
  await expect(page).toHaveURL(originalUrl);
  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Search assets' })).toHaveValue('icon');
  await expect(page.getByRole('button', { name: 'Icons', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('combobox', { name: 'Filter by access' })).toHaveValue('all');

  await page.goto('/search?q=__phase10_no_result__');
  await expect(page.getByRole('heading', { name: 'No matching assets' })).toBeVisible();
  await expect(page.getByText('No assets match these filters.')).toBeVisible();
  await expect(page.locator('#results-count')).toHaveText('0 preview results');
  await expect(page.locator('.search-empty')).toHaveCSS('border-style', 'solid');

  await page.goto('/search?q=icon');
  const query = await page.getByRole('searchbox', { name: 'Search assets' }).inputValue();
  const card = page.locator('.asset-card').first();
  await card.focus();
  await card.press('Enter');
  await expect(page.locator('#asset-modal')).toBeVisible();
  expect(page.url()).toContain('/asset/');
  await page.goBack();
  await expect(page).toHaveURL(/\/search\?q=icon$/);
  await expect(page.getByRole('searchbox', { name: 'Search assets' })).toHaveValue(query);
  await expect(card).toBeFocused();
  await page.goForward();
  await expect(page.locator('#asset-modal')).toBeVisible();
});

test('route editorial surfaces preserve hierarchy, containment, and route behavior', async ({ page }, testInfo) => {
  const routes = ['/icons', '/banners', '/animated', '/wallpapers', '/recent', '/collections', '/collections/noface-icons', '/categories/ethereal', '/about', '/phase-11-not-found'];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  }

  await page.goto('/collections/noface-icons');
  await expect(page.getByRole('link', { name: 'All collections' })).toHaveAttribute('href', '/collections');
  await expect(page.locator('.route-hero')).toHaveCSS('border-radius', testInfo.project.name === 'mobile' ? '14px' : '20px');
  await expect(page.locator('.route-copy h1')).toHaveCSS('font-weight', '600');
  await expect(page.locator('.tag').first()).toHaveCSS('min-height', '28px');
  await page.locator('.back-link').focus();
  await expect(page.locator('.back-link')).toBeFocused();
  const longContent = await page.evaluate(() => {
    const title = document.querySelector('.route-copy h1');
    const copy = document.querySelector('.route-copy > p');
    const tag = document.querySelector('.tag');
    title.textContent = 'A deliberately long collection title that must remain contained';
    copy.textContent = 'A deliberately long collection description that tests natural wrapping without changing the route, grid, or authored production data.';
    tag.textContent = 'a-deliberately-long-metadata-label-that-must-contain';
    const hero = document.querySelector('.route-hero').getBoundingClientRect();
    return {
      titleContained: title.getBoundingClientRect().right <= hero.right,
      copyContained: copy.getBoundingClientRect().right <= hero.right,
      tagContained: tag.getBoundingClientRect().right <= hero.right,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(longContent).toEqual({ titleContained: true, copyContained: true, tagContained: true, overflow: 0 });

  await page.goto('/categories/ethereal');
  await expect(page.getByRole('heading', { name: 'This category is empty.' })).toBeVisible();
  await expect(page.locator('.route-empty')).toHaveCSS('border-style', 'solid');

  await page.goto('/phase-11-not-found');
  await expect(page.getByRole('heading', { name: 'Nothing here.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
});

test('footer and application shell preserve landmarks, routes, and short-page flow', async ({ page }) => {
  await page.goto('/phase-12-not-found');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('.footer-group')).toHaveCount(2);
  await expect(page.locator('.footer-group a')).toHaveCount(8);
  await expect(page.locator('footer .brand')).toHaveAccessibleName('pfseeker home');
  await expect(page.locator('footer .footer-profile-logo')).toBeVisible();
  await expect(page.locator('.footer-legal')).toContainText('© 2026 pfseeker');
  await expect(page.locator('.site-footer')).not.toContainText('Neuevault');
  await expect(page.locator('.footer-group a').first().locator('.roll-text-layer')).toHaveCount(2);
  await expect(page.locator('.footer-profile-brand .roll-text-layer')).toHaveCount(2);

  const shell = await page.evaluate(() => {
    const header = document.querySelector('header').getBoundingClientRect();
    const main = document.querySelector('main').getBoundingClientRect();
    const footer = document.querySelector('footer').getBoundingClientRect();
    return {
      order: header.top <= main.top && main.bottom <= footer.top,
      bottomAligned: footer.bottom >= innerHeight - 1,
      overlap: Math.max(0, main.bottom - footer.top),
      position: getComputedStyle(document.querySelector('footer')).position,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(shell).toMatchObject({ order: true, bottomAligned: true, overlap: 0, position: 'static', overflow: 0 });

  const about = page.locator('.footer-group a[href="/about"]');
  await about.focus();
  await expect(about).toBeFocused();
  await about.click();
  await expect(page).toHaveURL('/about');
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Saved with intent.' })).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.footer-group a[href="/search"]')).toHaveCSS('transition-duration', '0s');
});

test('sign-in remains an unavailable boundary without backend requests', async ({ page }, testInfo) => {
  const protectedRequests = []; page.on('request', request => { if (request.url().includes('/api/') && !request.url().endsWith('/api/auth/session')) protectedRequests.push(request.url()); });
  await page.goto('/'); if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'Sign In' }).last().click();
  await expect(page.locator('#auth-title')).toHaveText('Authentication unavailable'); expect(protectedRequests).toEqual([]);
});

test('authenticated session is reflected and logout is CSRF-protected', async ({ page }, testInfo) => {
  let authenticated = true;
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, authenticated, user: authenticated ? { id: 'discord-1', displayName: 'Vault Member', avatarUrl: null } : null, csrfToken: authenticated ? 'csrf-test' : null }) }));
  await page.route('**/api/auth/logout*', async route => {
    expect(route.request().method()).toBe('POST'); expect(route.request().headers()['x-csrf-token']).toBe('csrf-test'); authenticated = false;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"authenticated":false}' });
  });
  await page.goto('/');
  if ((page.viewportSize()?.width || 1000) < 700) await page.locator('.menu-toggle').click();
  const signIn = page.locator('.sign-in:visible, .sign-in-mobile:visible'); await expect(signIn).toHaveText('Vault Member');
  await signIn.click(); await expect(page.locator('#auth-title')).toHaveText('Signed in');
  await page.locator('.auth-logout').click();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('.sign-in:visible, .sign-in-mobile:visible').locator('.roll-text-layer').first()).toHaveText('Sign In');
});

test('a directly linked restricted panel refreshes after session discovery', async ({ page }) => {
  await page.route('**/api/auth/session*', async route => {
    await new Promise(resolve => setTimeout(resolve, 80));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, authenticated: true, user: { id: 'discord-1', displayName: 'Vault Member', avatarUrl: null }, csrfToken: 'csrf-test' }) });
  });
  await page.goto('/asset/nv-166/restricted-test');
  await expect(page.locator('.download-action .roll-text-layer').first()).toHaveText('Download restricted original');
});

test('public JPEG, PNG, and animated GIF downloads succeed cross-origin', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":false,"authenticated":false,"user":null,"csrfToken":null}' }));
  const manifest = JSON.parse(await readFile(path.resolve('src/generated/assets.json'), 'utf8'));
  const assets = ['JPG', 'PNG', 'GIF'].map(fileType => manifest.find(asset => asset.fileType === fileType && !asset.requiresDiscordAuth));
  const consoleErrors = []; const restrictedRequests = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', request => { if (/\/(?:authenticated|restricted)\//.test(request.url())) restrictedRequests.push(request.url()); });
  for (const asset of assets) {
    await page.goto(`/asset/${asset.id}/${asset.slug}`);
    const responsePromise = page.waitForResponse(response => response.url() === asset.downloadUrl);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download original/ }).click();
    const [response, download] = await Promise.all([responsePromise, downloadPromise]);
    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-origin']).toBe('*');
    expect(response.headers()['content-disposition']).toMatch(/^attachment;/);
    expect(await download.suggestedFilename()).toBe(`${asset.id}-${asset.slug}.${asset.fileType.toLowerCase()}`);
    if (asset.fileType === 'GIF') {
      const metadata = await sharp(await response.body(), { animated: true }).metadata();
      expect(metadata.format).toBe('gif'); expect(metadata.pages).toBeGreaterThan(1);
    }
  }
  expect(restrictedRequests).toEqual([]); expect(consoleErrors).toEqual([]);
});

test('an ingested manifest asset appears in the gallery and opens its modal', async ({ page }) => {
  const manifest = JSON.parse(await readFile(path.resolve('src/generated/assets.json'), 'utf8'));
  const asset = manifest[0]; expect(asset.src).toMatch(/^(?:\/media\/originals\/|https:\/\/res\.cloudinary\.com\/)/);
  await page.goto('/'); const card = page.getByRole('button', { name: `Open ${asset.title}` }); await expect(card).toBeVisible(); await card.click();
  await expect(page.locator('#modal-title')).toHaveText(asset.title);
});

test('restricted source remains outside public and built output', async () => {
  const manifest = JSON.parse(await readFile(path.resolve('src/generated/assets.json'), 'utf8'));
  for (const asset of manifest.filter(item => item.requiresDiscordAuth)) for (const root of ['public', 'dist']) await expect(access(path.resolve(root, asset.src || `media/originals/${path.basename(asset.sourceFile)}`))).rejects.toThrow();
});

test('animated gallery cards use bounded single-frame dimensions', async ({ page }) => {
  await page.goto('/recent');
  const animated = page.locator('.asset-card').filter({ has: page.locator('.format-badge') }).first();
  await expect(animated).toBeVisible();
  const box = await animated.boundingBox(); expect(box.height).toBeLessThan(900);
  await expect(animated.locator('.asset-overlay')).toContainText(/800×320|720×433|[1-9]\d*×[1-9]\d*/);
});

test('collection cards compose count and description without legacy count copy', async ({ page }) => {
  await page.goto('/collections');
  await expect(page.locator('a[href="/collections/noface-icons"] .collection-meta p')).toHaveText('25 Anonymous and melancholic icons.');
  await expect(page.getByText('in full archive')).toHaveCount(0);
});

test('homepage collection section follows the reference geometry contract', async ({ page }, testInfo) => {
  await page.goto('/');
  const section = page.locator('.collection-section');
  const grid = section.locator('.collection-grid');
  const cards = grid.locator('.collection-card');
  await expect(cards).toHaveCount(6);

  const geometry = await section.evaluate(element => {
    const grid = element.querySelector('.collection-grid');
    const card = grid.querySelector('.collection-card');
    const cover = card.querySelector('.collection-cover');
    const meta = card.querySelector('.collection-meta');
    const header = element.querySelector('.section-head');
    const rect = target => target.getBoundingClientRect();
    return {
      section: rect(element),
      grid: rect(grid),
      card: rect(card),
      cover: rect(cover),
      meta: rect(meta),
      gridGap: getComputedStyle(grid).gap,
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      cardRadius: getComputedStyle(card).borderRadius,
      mediaRadius: getComputedStyle(cover).borderRadius,
      metaPadding: getComputedStyle(meta).padding,
      headerGap: rect(grid).top - rect(header).bottom,
      clientWidth: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  expect(geometry.overflow).toBeLessThanOrEqual(0);
  if (testInfo.project.name === 'mobile') {
    expect(geometry.columns).toBe(1);
    expect(geometry.cardRadius).toBe('14px');
    expect(geometry.card.width).toBeGreaterThan(340);
  } else {
    expect(geometry.columns).toBe(3);
    expect(geometry.gridGap).toBe('15px');
    const expectedSectionWidth = Math.min(geometry.clientWidth - 20, 1440);
    expect(geometry.section.width).toBeCloseTo(expectedSectionWidth, 0);
    expect(geometry.card.width).toBeCloseTo((expectedSectionWidth - 30) / 3, 0);
    expect(geometry.cover.width / geometry.cover.height).toBeCloseTo(41 / 44, 2);
    expect(geometry.cardRadius).toBe('20px');
    expect(geometry.mediaRadius).toBe('15px');
    expect(geometry.metaPadding).toBe('24px');
    expect(geometry.headerGap).toBeCloseTo(30, 0);
  }
});

test('homepage reserves six collection slots without fake interactive records', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  for (const width of [320, 375, 700, 701, 1024, 1199, 1200, 1440, 1600, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const slots = page.locator('.collection-grid > .collection-card');
    const real = page.locator('.collection-grid > a.collection-card');
    const empty = page.locator('.collection-grid > .collection-card-empty');
    await expect(slots).toHaveCount(6);
    await expect(real).toHaveCount(4);
    await expect(empty).toHaveCount(2);
    expect(await real.evaluateAll(cards => cards.map(card => card.getAttribute('href')))).toEqual([
      '/collections/noface-icons', '/collections/anime-girl-icons', '/collections/imvu-pack-01', '/collections/white-minimal-banners',
    ]);
    expect(await empty.evaluateAll(cards => cards.map(card => ({ tag: card.tagName, hidden: card.getAttribute('aria-hidden'), text: card.textContent.trim(), focusable: card.matches('a, button, [tabindex]') })))).toEqual([
      { tag: 'DIV', hidden: 'true', text: '', focusable: false },
      { tag: 'DIV', hidden: 'true', text: '', focusable: false },
    ]);
    const geometry = await slots.evaluateAll(cards => cards.map(card => ({ width: card.getBoundingClientRect().width, height: card.getBoundingClientRect().height, empty: card.classList.contains('collection-card-empty') })));
    const reference = geometry[3];
    expect(geometry.filter(card => card.empty).every(card => Math.abs(card.width - reference.width) < 0.6 && Math.abs(card.height - reference.height) < 0.6)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
});

test('homepage section headings share one visual contract and the collection action is centered below the grid', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const collection = document.querySelector('.collection-section .home-section-head');
    const recent = document.querySelector('.recent-section .home-section-head');
    const project = header => {
      const heading = header.querySelector('h2');
      const headingStyle = getComputedStyle(heading);
      const bounds = header.getBoundingClientRect();
      return {
        x: bounds.x, width: bounds.width, alignItems: getComputedStyle(header).alignItems,
        heading: [headingStyle.fontSize, headingStyle.lineHeight, headingStyle.fontWeight, headingStyle.letterSpacing],
      };
    };
    const actionWrap = document.querySelector('.collection-section-action');
    const action = actionWrap.querySelector('.section-head-action');
    return { collection: project(collection), recent: project(recent), action: { label: action.getAttribute('aria-label'), href: action.getAttribute('href'), justify: getComputedStyle(actionWrap).justifyContent, afterGrid: actionWrap.previousElementSibling?.classList.contains('collection-grid') } };
  });
  expect(result.recent.heading).toEqual(result.collection.heading);
  expect(result.action).toEqual({ label: 'Browse more', href: '/collections', justify: 'center', afterGrid: true });
});

test('collection metadata remains natural-height for real copy', async ({ page }) => {
  await page.goto('/collections');
  const results = await page.locator('.collection-card').evaluateAll(cards => cards.map(card => {
    const title = card.querySelector('h3');
    const description = card.querySelector('.collection-meta p');
    return {
      titleContained: title.scrollHeight <= title.clientHeight,
      descriptionContained: description.scrollHeight <= description.clientHeight,
      cardContained: card.scrollHeight <= card.clientHeight,
    };
  }));
  expect(results.length).toBeGreaterThan(1);
  expect(results.every(result => Object.values(result).every(Boolean))).toBe(true);
});

test('collection cards crossfade deterministic alternate previews without geometry movement', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/collections');
  const card = page.locator('a[href="/collections/white-minimal-banners"]');
  const frame = card.locator('.media-default');
  const staticCover = card.locator('.media-default .cover-static');
  const alternate = card.locator('.cover-alternate');
  const defaultAnimated = card.locator('.media-default .cover-animated');
  const alternateAnimated = card.locator('.media-alternate .cover-animated');
  await card.scrollIntoViewIfNeeded();
  const state = () => card.evaluate(element => {
    const shell = getComputedStyle(element);
    const cover = element.querySelector('.collection-cover');
    const media = element.querySelector('.media-default');
    const staticLayer = element.querySelector('.media-default');
    const alternateLayer = element.querySelector('.media-alternate');
    return {
      shellTransform: shell.transform,
      mediaTransform: getComputedStyle(media).transform,
      shellRadius: shell.borderRadius,
      mediaRadius: getComputedStyle(cover).borderRadius,
      borderWidth: shell.borderWidth,
      size: { width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height },
      staticOpacity: getComputedStyle(staticLayer).opacity,
      alternateOpacity: alternateLayer ? getComputedStyle(alternateLayer).opacity : null,
      alternateDuration: alternateLayer ? getComputedStyle(alternateLayer).transitionDuration : null,
      outline: shell.outlineStyle,
    };
  });

  await expect(card).toHaveAccessibleName('White Banners Collection 11 Bright and minimal banners');
  await expect(staticCover).toBeVisible();
  await expect(defaultAnimated).toHaveAttribute('src', /nv-054\.gif$/);
  await expect(defaultAnimated).toHaveCSS('opacity', '1');
  const initial = await state();
  expect(initial).toMatchObject({ shellTransform: 'none', mediaTransform: 'none', shellRadius: '20px', mediaRadius: '15px', borderWidth: '0px', staticOpacity: '1', alternateOpacity: '0', alternateDuration: '1s' });

  await card.hover();
  await expect(alternate).toHaveAttribute('src', /nv-026\./);
  await expect(card).toHaveClass(/cover-playing/);
  await expect(alternateAnimated).toHaveAttribute('src', /nv-026\.gif$/);
  await expect(alternateAnimated).toHaveCSS('opacity', '1');
  await page.waitForTimeout(1100);
  const hovered = await state();
  expect(hovered).toMatchObject({ shellTransform: 'none', mediaTransform: 'none', borderWidth: '0px', staticOpacity: '0', alternateOpacity: '1', size: initial.size });

  await page.locator('.page-title').hover();
  await expect(card).not.toHaveClass(/cover-playing/);
  await page.waitForTimeout(1100);
  await expect(alternateAnimated).not.toHaveAttribute('src');
  await expect(defaultAnimated).not.toHaveAttribute('src');
  const exit = await state();
  expect(exit).toMatchObject({ staticOpacity: '1', alternateOpacity: '0', size: initial.size });
  await expect(alternate).toHaveAttribute('src', /nv-026\./);
  await expect(frame).toHaveCSS('transform', 'none');
  await expect(card).toHaveCSS('transform', 'none');

  await card.focus();
  await expect(card).toBeFocused();
  await expect(defaultAnimated).toHaveAttribute('src', /nv-054\.gif$/);
  await expect(card).toHaveCSS('outline-style', 'solid');
  await expect(alternate).toHaveAttribute('src', /nv-026\./);
  await page.waitForTimeout(1100);
  expect(await state()).toMatchObject({ shellTransform: 'none', mediaTransform: 'none', alternateOpacity: '1', size: initial.size });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1100);
  expect(await state()).toMatchObject({ staticOpacity: '1', alternateOpacity: '0', size: initial.size });
});

test('collection cards stay static for touch and reduced motion', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') {
    await page.goto('/collections');
    const card = page.locator('a[href="/collections/white-minimal-banners"]');
    const initialUrl = page.url();
    await expect(card.locator('.media-default .cover-static')).toBeVisible();
    await card.tap();
    await expect(page).toHaveURL(/\/collections\/white-minimal-banners$/);
    expect(page.url()).not.toBe(initialUrl);
    return;
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/collections');
  const card = page.locator('a[href="/collections/white-minimal-banners"]');
  const alternate = card.locator('.cover-alternate');
  await card.hover();
  await expect(card).toHaveCSS('transform', 'none');
  expect(await card.locator('.collection-media-frame').evaluateAll(frames => frames.every(frame => getComputedStyle(frame).transform === 'none'))).toBe(true);
  await expect(alternate).not.toHaveAttribute('src');
  await expect(card.locator('.media-default .cover-static')).toBeVisible();
});

test('new hosted collection members participate in visual alternate previews', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/collections');
  const card = page.locator('a[href="/collections/imvu-pack-01"]');
  await expect(card.locator('.media-default .cover-static')).toBeVisible();
  await expect(card.locator('.cover-alternate')).toHaveCount(1);
  await card.hover();
  await expect(card).toHaveClass(/cover-playing/);
});

test('collection preview failures retain media geometry without blanking healthy static covers', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/collections');
  const staticCard = page.locator('a[href="/collections/noface-icons"]');
  const before = await staticCard.locator('.collection-cover').boundingBox();
  await staticCard.locator('.media-default .cover-static').evaluate(image => {
    image.src = '/missing-collection-preview.jpg';
  });
  await expect(staticCard.locator('.collection-cover')).toHaveClass(/image-error/);
  expect(await staticCard.locator('.collection-cover').evaluate(element => getComputedStyle(element, '::after').content)).toContain('Preview unavailable');
  const after = await staticCard.locator('.collection-cover').boundingBox();
  expect(Math.round(after.width)).toBe(Math.round(before.width));
  expect(Math.round(after.height)).toBe(Math.round(before.height));

  const alternateCard = page.locator('a[href="/collections/white-minimal-banners"]');
  const alternate = alternateCard.locator('.cover-alternate');
  await alternate.evaluate(image => {
    image.dataset.alternateSrc = '/missing-collection-preview.jpg';
  });
  await alternateCard.hover();
  await expect(alternateCard).not.toHaveClass(/cover-playing/);
  await expect(alternateCard.locator('.media-default .cover-static')).toBeVisible();
  await expect(alternateCard.locator('.cover-alternate')).toHaveCount(0);
  await expect(alternateCard.locator('.collection-cover')).not.toHaveClass(/image-error/);

  await page.reload();
  const animatedCard = page.locator('a[href="/collections/white-minimal-banners"]');
  const animatedDefault = animatedCard.locator('.media-default .cover-animated');
  await animatedDefault.evaluate(image => { image.src = '/missing-default-animation.gif'; });
  await expect(animatedDefault).toHaveCount(0);
  await expect(animatedCard.locator('.media-default .cover-static')).toBeVisible();

  const animatedAlternate = animatedCard.locator('.media-alternate .cover-animated');
  await page.locator('.page-title').hover();
  await animatedAlternate.evaluate(image => { image.removeAttribute('src'); image.dataset.animatedSrc = '/missing-alternate-animation.gif'; });
  await animatedCard.hover();
  await expect(animatedCard).toHaveClass(/cover-playing/);
  await expect(animatedAlternate).toHaveCount(0);
  await expect(animatedCard.locator('.media-alternate .cover-alternate')).toBeVisible();
});

test('collection alternate preview loads on hover or focus and returns to static', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/collections'); const card = page.locator('a[href="/collections/white-minimal-banners"]'); const alternate = card.locator('.cover-alternate');
  await expect(alternate).not.toHaveAttribute('src'); await card.hover();
  await expect(alternate).toHaveAttribute('src', /nv-026\./); await expect(card).toHaveClass(/cover-playing/);
  await page.locator('.page-title').hover(); await expect(card).not.toHaveClass(/cover-playing/); await expect(alternate).toHaveAttribute('src', /nv-026\./);
  await card.focus(); await expect(card).toHaveClass(/cover-playing/); await page.keyboard.press('Tab'); await expect(card).not.toHaveClass(/cover-playing/);
  await page.goto('/about');
  expect(await page.evaluate(async () => (await import('/src/components/cards.js')).activeCoverBindingCount())).toBe(0);
});

test('reduced motion and restricted cover policy remain static', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const protectedRequests = []; page.on('request', request => { if (request.url().includes('/restricted/') || request.url().includes('/authenticated/')) protectedRequests.push(request.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/collections'); const card = page.locator('a[href="/collections/white-minimal-banners"]'); const alternate = card.locator('.cover-alternate');
  await card.hover(); await expect(alternate).not.toHaveAttribute('src');
  const restrictedUrl = await page.evaluate(async () => (await import('/src/data/mediaUrls.js')).animatedCoverUrl({ animated: true, requiresDiscordAuth: true, src: null }));
  expect(restrictedUrl).toBe(''); expect(protectedRequests).toEqual([]);
});

test('gallery animation follows viewport visibility and observers clean up', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/recent'); const card = page.locator('.asset-card').filter({ has: page.locator('.format-badge') }).first(); const animated = card.locator('.asset-animated'); const staticImage = card.locator('.asset-static');
  await card.evaluate(element => window.scrollTo(0, element.offsetTop + 1200)); await page.waitForTimeout(300);
  await expect(animated).not.toHaveAttribute('src'); await expect(staticImage).toHaveAttribute('src', /(?:\/media\/previews\/|\/pg_1,)/);
  await card.scrollIntoViewIfNeeded(); await expect(animated).toHaveAttribute('src', /nv-\d+\.gif$/); await expect(card).toHaveClass(/asset-playing/);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(300);
  await expect(animated).not.toHaveAttribute('src'); await expect(card).not.toHaveClass(/asset-playing/);
  await page.goto('/about');
  const observers = await page.evaluate(async () => (await import('/src/components/AssetGrid.js')).activeAnimationObserverCount());
  const coverObservers = await page.evaluate(async () => (await import('/src/components/cards.js')).activeCoverObserverCount());
  expect(observers).toBe(0); expect(coverObservers).toBe(0);
});

test('reduced motion keeps visible gallery GIFs static', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop'); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/recent');
  const card = page.locator('.asset-card').filter({ has: page.locator('.format-badge') }).first(); await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await expect(card.locator('.asset-animated')).not.toHaveAttribute('src'); await expect(card).not.toHaveClass(/asset-playing/);
});

test('asset masonry matches the measured desktop frame and preserves hover/focus/touch metadata', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'desktop') {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto('/recent');
    const grid = page.locator('.masonry');
    const card = page.locator('.asset-card').first();
    await expect.poll(() => page.locator('.asset-card').count()).toBeGreaterThan(8);
    const geometry = await page.locator('.asset-grid-component').evaluate((component) => {
      const cards = [...component.querySelectorAll('.asset-card')];
      const first = cards[0].getBoundingClientRect();
      const columns = [...new Set(cards.map(item => Math.round(item.getBoundingClientRect().x * 100) / 100))].sort((a, b) => a - b);
      return {
        component: component.getBoundingClientRect().toJSON(),
        card: first.toJSON(),
        columns,
        gap: columns[1] - columns[0] - first.width,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(geometry.component.width).toBeCloseTo(1440, 1);
    expect(geometry.component.x).toBeCloseTo(80, 1);
    expect(geometry.card.width).toBeCloseTo(348.75, 1);
    expect(geometry.columns).toHaveLength(4);
    expect(geometry.gap).toBeCloseTo(15, 1);
    expect(geometry.overflow).toBe(0);
    await expect(card).toHaveCSS('border-radius', '15px');
    await card.hover();
    await expect(card.locator('.asset-overlay')).toHaveCSS('opacity', '1');
    await expect.poll(() => card.locator('.asset-static').evaluate(image => new DOMMatrixReadOnly(getComputedStyle(image).transform).a)).toBeCloseTo(1.025, 3);
    await page.locator('.page-title').hover();
    await card.focus();
    await expect(card.locator('.asset-overlay')).toHaveCSS('opacity', '1');
    await expect.poll(() => card.locator('.asset-static').evaluate(image => new DOMMatrixReadOnly(getComputedStyle(image).transform).a)).toBeCloseTo(1.025, 3);
    await expect(grid).toBeVisible();
  } else {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/recent');
    const cards = page.locator('.asset-card');
    await expect.poll(() => cards.count()).toBeGreaterThan(8);
    await expect(cards.first().locator('.asset-overlay')).toHaveCSS('opacity', '1');
    const mobile = await page.locator('.asset-grid-component').evaluate((component) => {
      const cards = [...component.querySelectorAll('.asset-card')];
      return {
        width: component.getBoundingClientRect().width,
        columns: new Set(cards.map(card => Math.round(card.getBoundingClientRect().x))).size,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(mobile.columns).toBe(2);
    expect(mobile.width).toBeCloseTo(306, 1);
    expect(mobile.overflow).toBe(0);
  }
});

test('asset preview failures preserve stable geometry and animated failure keeps the static preview', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route(/nv-\d+\.gif(?:\?|$)/, route => {
    const url = route.request().url();
    return url.includes('/originals/') || (url.includes('/neuevault/public/animated/') && !url.includes('/pg_1,'))
      ? route.abort()
      : route.continue();
  });
  await page.goto('/recent');
  const animatedCard = page.locator('.asset-card').filter({ has: page.locator('.format-badge') }).first();
  await animatedCard.scrollIntoViewIfNeeded();
  await expect(animatedCard.locator('.asset-animated')).toHaveCount(0);
  await expect(animatedCard.locator('.asset-static')).toBeVisible();
  await expect(animatedCard.locator('.asset-thumb')).not.toHaveClass(/image-error/);

  const staticCard = page.locator('.asset-card').filter({ hasNot: page.locator('.format-badge') }).first();
  await staticCard.locator('.asset-static').evaluate(image => image.dispatchEvent(new Event('error')));
  await expect(staticCard.locator('.asset-static')).toHaveCount(0);
  await expect(staticCard.locator('.asset-thumb')).toHaveClass(/image-error/);
  expect((await staticCard.boundingBox()).height).toBeGreaterThanOrEqual(180);
});

test('category cards share base and hover visual treatment', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop'); await page.goto('/');
  const first = page.locator('a[href="/categories/ethereal"]'); const fourth = page.locator('a[href="/categories/matching"]');
  const visual = card => card.evaluate(element => {
    const media = getComputedStyle(element.querySelector('.cover-media')); const matrix = new DOMMatrixReadOnly(media.transform);
    return { opacity: media.opacity, scale: matrix.a, staticTransform: getComputedStyle(element.querySelector('.cover-static')).transform, border: getComputedStyle(element).borderColor, overlay: getComputedStyle(element, '::after').backgroundColor };
  });
  expect(await visual(first)).toEqual(await visual(fourth)); expect((await visual(first))).toMatchObject({ opacity: '0', scale: 1.4, staticTransform: 'none' });
  await first.hover(); await page.waitForTimeout(1100); const firstHover = await visual(first); expect(firstHover).toMatchObject({ opacity: '1', scale: 1, staticTransform: 'none', overlay: 'rgba(0, 0, 0, 0.08)' });
  await page.locator('.hero').hover(); await first.focus(); await page.waitForTimeout(1100); expect((await visual(first))).toMatchObject({ opacity: '1', scale: 1 });
  await page.locator('.hero').hover(); await page.waitForTimeout(250); await fourth.hover(); await expect(fourth).toHaveClass(/cover-playing/); await page.waitForTimeout(1100); const fourthHover = await fourth.locator('.cover-animated').evaluate(element => getComputedStyle(element).opacity);
  expect(fourthHover).toBe('1');
  await expect(fourth.locator('.cover-animated')).toHaveAttribute('src', /nv-044\.gif$/);
  const loadedAnimated = await fourth.locator('.cover-animated').evaluate(element => ({ complete: element.complete, naturalWidth: element.naturalWidth }));
  expect(loadedAnimated.complete).toBe(true); expect(loadedAnimated.naturalWidth).toBeGreaterThan(0);
  await page.locator('.hero').hover(); await expect(fourth).not.toHaveClass(/cover-playing/);
  for (const delay of [0, 50, 100, 150]) {
    if (delay) await page.waitForTimeout(50);
    const layerOpacity = await fourth.evaluate(element => {
      const value = selector => Number.parseFloat(getComputedStyle(element.querySelector(selector)).opacity);
      return value('.cover-static') + value('.cover-animated');
    });
    expect(layerOpacity).toBeGreaterThanOrEqual(0.99);
  }
  await page.waitForTimeout(100); await expect(fourth.locator('.cover-animated')).not.toHaveAttribute('src');
});

test('category cards honor the Figma geometry and remain usable on touch', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: testInfo.project.name === 'desktop' ? 1920 : 320, height: 900 }); await page.goto('/');
  const grid = page.locator('.category-grid'); const card = page.locator('a[href="/categories/ethereal"]'); const title = card.locator('h2'); const count = card.locator('small');
  if (testInfo.project.name === 'desktop') {
    const geometry = await grid.evaluate(element => { const card = element.querySelector('.category-card'); const copy = card.querySelector('.category-copy-inner'); const gridStyle = getComputedStyle(element); const cardStyle = getComputedStyle(card); const rect = card.getBoundingClientRect(); return { gridWidth: element.getBoundingClientRect().width, columns: gridStyle.gridTemplateColumns.split(' ').length, gap: gridStyle.gap, copyGap: getComputedStyle(copy).gap, cardWidth: rect.width, cardHeight: rect.height, radius: cardStyle.borderRadius }; });
    expect(geometry).toEqual({ gridWidth: 1888, columns: 4, gap: '16px', copyGap: '10px', cardWidth: 460, cardHeight: 478, radius: '20px' });
    await expect(title).toHaveCSS('font-family', /SF Pro/); await expect(title).toHaveCSS('font-weight', '500'); await expect(title).toHaveCSS('font-size', '24px'); await expect(title).toHaveCSS('line-height', '29px');
    await expect(count).toHaveCSS('font-family', /SF Pro/); await expect(count).toHaveCSS('font-weight', '400'); await expect(count).toHaveCSS('font-size', '12px'); await expect(count).toHaveCSS('line-height', '29px');
    expect(await page.evaluate(() => document.fonts.check('500 24px "SF Pro"'))).toBe(true);
  } else {
    const media = card.locator('.cover-media');
    await expect(media).toHaveCSS('opacity', '1'); await expect(media).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    await expect(page.locator('a[href="/categories/matching"] .cover-animated')).not.toHaveAttribute('src');
    expect(await title.evaluate(element => element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.parentElement.clientHeight)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

import { expect, test } from '@playwright/test';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

test('mobile navigation keeps Collections and sign-in unavailable reachable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/'); await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('link', { name: /Collections/ }).last()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in unavailable' }).last()).toBeVisible();
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
  await panel.locator('a[href="/about"]').evaluate(element => element.addEventListener('click', event => event.preventDefault(), { once: true }));
  await panel.locator('a[href="/about"]').click(); await expect(panel).toHaveClass(/open/); await expect(page).toHaveURL(beforeEscape);
  await panel.locator('a[href="/about"]').click(); await expect(page).toHaveURL(/\/about$/);
  await expect(panel).not.toHaveClass(/open/); await expect(toggle).toHaveAttribute('aria-expanded', 'false'); await expect(toggle).not.toBeFocused();
  await expect(page.locator('.site-header [aria-current="page"]')).toHaveCount(1); await expect(panel.locator('[data-nav="about"]')).toHaveAttribute('aria-current', 'page');
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

  const collections = page.locator(testInfo.project.name === 'mobile' ? '.mobile-nav-actions .collections-button' : '.nav-actions .collections-button');
  await expect(collections.locator('.roll-icon svg.icon')).toHaveCount(2);
  await expect(collections).toHaveAccessibleName('Collections');
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

test('hero bolt uses normalized artwork bounds without changing CTA geometry', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  for (const width of [320, 375, 700, 1200, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 700 ? 820 : 900 });
    await page.goto('/');
    const measurement = await page.locator('.hero-cta').evaluate(element => {
      const svg = element.querySelector('.roll-icon-layer:first-child svg');
      const path = svg.querySelector('path');
      const cta = element.getBoundingClientRect();
      const icon = svg.getBoundingClientRect();
      const artwork = path.getBoundingClientRect();
      const pathBounds = path.getBBox();
      const viewBox = svg.viewBox.baseVal;
      return {
        cta: { width: cta.width, height: cta.height },
        icon: { width: icon.width, height: icon.height },
        artwork: {
          width: artwork.width,
          height: artwork.height,
          centerX: artwork.left + artwork.width / 2 - (icon.left + icon.width / 2),
          centerY: artwork.top + artwork.height / 2 - (icon.top + icon.height / 2),
          clipped:
            artwork.left < icon.left - 0.05 ||
            artwork.top < icon.top - 0.05 ||
            artwork.right > icon.right + 0.05 ||
            artwork.bottom > icon.bottom + 0.05,
        },
        viewBox: [viewBox.x, viewBox.y, viewBox.width, viewBox.height],
        occupancy: {
          width: pathBounds.width / viewBox.width,
          height: pathBounds.height / viewBox.height,
        },
      };
    });
    expect(measurement.cta).toEqual({ width: 164, height: 47 });
    expect(measurement.icon).toEqual({ width: 13, height: 16 });
    expect(measurement.viewBox).toEqual([3, 1, 18, 22]);
    expect(measurement.occupancy.width).toBeGreaterThan(0.88);
    expect(measurement.occupancy.height).toBeGreaterThan(0.9);
    expect(measurement.artwork.width).toBeGreaterThan(11.4);
    expect(measurement.artwork.height).toBeGreaterThan(14.3);
    expect(Math.abs(measurement.artwork.centerX)).toBeLessThan(0.05);
    expect(Math.abs(measurement.artwork.centerY)).toBeLessThan(0.05);
    expect(measurement.artwork.clipped).toBe(false);
  }
});

test('homepage navbar assets and hero media preserve routes and exact copy', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('.site-header .brand-logo');
  await expect(logo).toBeVisible();
  const logoShell = page.locator('.site-header .brand-logo-shell');
  expect(await logoShell.evaluate(element => { const style = getComputedStyle(element); return { width: style.width, height: style.height, radius: style.borderRadius, overflow: style.overflow, background: style.backgroundColor }; })).toEqual({ width: '34px', height: '34px', radius: '12px', overflow: 'hidden', background: 'rgb(18, 18, 18)' });
  await expect(logo).toHaveCSS('width', '18px');
  await expect(logo).toHaveCSS('height', '18px');
  await expect(page.locator('.site-header .brand-wordmark')).toHaveCSS('font-family', /TBJ Neuetra/);
  await expect(page.locator('.collections-button').first()).toHaveAttribute('href', '/collections');
  const eyebrow = page.locator('.hero-eyebrow');
  await expect(eyebrow).toHaveText('Meet pfseeker 2.0');
  await expect(eyebrow).toHaveCSS('font-family', /SF Pro Rounded/);
  await expect(eyebrow).toHaveCSS('font-weight', '500');
  expect(await eyebrow.evaluate(element => ({ tag: element.tagName, tabindex: element.getAttribute('tabindex') }))).toEqual({ tag: 'P', tabindex: null });
  await expect(page.locator('.hero h1')).toHaveText('Discover the Best Banners on the internet. Literally.');
  await expect(page.locator('.hero h1')).toHaveCSS('font-family', /SF Pro Rounded/);
  await expect(page.locator('.hero h1')).toHaveCSS('font-weight', '600');
  await expect(page.getByRole('link', { name: 'Get Full Access', exact: true })).toHaveAttribute('href', '/recent');
  const description = page.locator('.hero-description');
  expect((await description.textContent()).replace(/\s+/g, ' ').trim()).toBe('Stop digging through endless pages of repeats, trend-chasing, or whatever everyone else is already using. Browse alt, emo, dark, soft, strange, cute, messy, and the spaces where they cross. Let different aesthetics coexist. Identity forms in the borderland.');
  await expect(description).toHaveCSS('font-family', /SF Pro Rounded/);
  await expect(description).toHaveCSS('font-weight', '500');
  const video = page.locator('.hero-video');
  await expect(video).toHaveCount(1);
  expect(await video.evaluate(element => ({ autoplay: element.autoplay, muted: element.muted, loop: element.loop, playsInline: element.playsInline, preload: element.preload }))).toEqual({ autoplay: true, muted: true, loop: true, playsInline: true, preload: 'metadata' });
  await expect(video).toHaveAttribute('src', /furina-hero-1080p\.mp4$/);
  const grain = page.locator('.hero-grain');
  await expect(grain).toHaveCSS('pointer-events', 'none');
  await expect(grain).toHaveCSS('background-image', /hero_grain\.png/);
  await expect(grain).toHaveCSS('background-repeat', 'no-repeat');
  await expect(page.locator('.hero-gradient')).toHaveCSS('background-image', /linear-gradient/);
  await expect(page.locator('.hero-gradient')).toHaveCSS('pointer-events', 'none');
  await page.goto('/recent');
  await expect(page.locator('.hero-video')).toHaveCount(0);
});

test('approved local fonts load without italic or legacy fallbacks', async ({ page }) => {
  const fontResponses = [];
  page.on('response', response => { if (response.url().includes('/fonts/')) fontResponses.push({ url: response.url(), status: response.status(), type: response.headers()['content-type'] || '' }); });
  await page.goto('/'); await page.evaluate(() => document.fonts.ready);
  for (const file of ['SF-Pro-Rounded-Regular.woff2', 'SF-Pro-Rounded-Medium.woff2', 'SF-Pro-Rounded-Semibold.woff2', 'tbj-neuetra-vf.woff2']) {
    const response = fontResponses.find(item => item.url.endsWith(file));
    expect(response).toBeTruthy(); expect(response.status).toBe(200); expect(response.type).toContain('font/woff2');
  }
  expect(fontResponses.some(item => item.url.includes('Italic-VariableFont'))).toBe(false);
  expect(fontResponses.some(item => /Arimo|Archivo|Inter/.test(item.url))).toBe(false);
  expect(await page.locator('.site-header .brand-wordmark').evaluate(element => getComputedStyle(element).fontFamily)).toContain('TBJ Neuetra');
  expect(await page.locator('.hero h1').evaluate(element => getComputedStyle(element).fontFamily)).toContain('SF Pro Rounded');
  expect(await page.locator('.hero-eyebrow').evaluate(element => getComputedStyle(element).fontFamily)).toContain('SF Pro Rounded');
});

test('large displays select only the 1440p hero source', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 1920, height: 1080 });
  const requests = [];
  page.on('request', request => { if (request.url().includes('furina-hero-')) requests.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('.hero-video')).toHaveAttribute('src', /furina-hero-1440p\.mp4$/);
  await page.waitForTimeout(400);
  expect(requests.some(url => url.endsWith('furina-hero-1080p.mp4'))).toBe(false);
});

test('hero uses approved desktop line groups and natural mobile wrapping', async ({ page }, testInfo) => {
  await page.goto('/');
  const titleLines = page.locator('.hero h1 > span');
  const descriptionLines = page.locator('.hero-description > span');
  await expect(titleLines).toHaveCount(2);
  await expect(descriptionLines).toHaveCount(3);
  await expect(titleLines).toHaveText(['Discover the Best', 'Banners on the internet. Literally.']);
  await expect(descriptionLines).toHaveText([
    'Stop digging through endless pages of repeats, trend-chasing, or whatever everyone else is already using.',
    'Browse alt, emo, dark, soft, strange, cute, messy, and the spaces where they cross.',
    'Let different aesthetics coexist. Identity forms in the borderland.',
  ]);
  if (testInfo.project.name === 'desktop') {
    await page.setViewportSize({ width: 1440, height: 900 });
    const titleBoxes = await titleLines.evaluateAll(elements => elements.map(element => ({ top: element.getBoundingClientRect().top, height: element.getBoundingClientRect().height, display: getComputedStyle(element).display })));
    const descriptionBoxes = await descriptionLines.evaluateAll(elements => elements.map(element => ({ top: element.getBoundingClientRect().top, height: element.getBoundingClientRect().height, display: getComputedStyle(element).display })));
    expect(titleBoxes.map(box => box.display)).toEqual(['block', 'block']);
    expect(descriptionBoxes.map(box => box.display)).toEqual(['block', 'block', 'block']);
    expect(titleBoxes[1].top).toBeGreaterThan(titleBoxes[0].top);
    expect(descriptionBoxes[1].top).toBeGreaterThan(descriptionBoxes[0].top);
    expect(descriptionBoxes[2].top).toBeGreaterThan(descriptionBoxes[1].top);
  } else {
    await expect(titleLines.first()).toHaveCSS('display', 'inline');
    await expect(descriptionLines.first()).toHaveCSS('display', 'inline');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('signed-out copy stays compact while the Discord OAuth action remains explicit', async ({ page }, testInfo) => {
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.route('**/api/auth/discord**', route => route.fulfill({ status: 204 }));
  await page.goto('/');
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  const signIn = page.locator('.sign-in:visible, .sign-in-mobile:visible');
  await expect(signIn.locator('.roll-text-layer').first()).toHaveText('Sign in');
  await expect(signIn).toHaveAttribute('aria-label', 'Sign in with Discord');
  await signIn.click();
  const oauthRequest = page.waitForRequest(request => new URL(request.url()).pathname === '/api/auth/discord');
  await page.getByRole('button', { name: 'Continue with Discord' }).click();
  expect(await oauthRequest).toBeTruthy();
});

test('reduced motion keeps the hero video paused on a static first frame', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const video = page.locator('.hero-video');
  await expect(video).not.toHaveAttribute('autoplay', '');
  expect(await video.evaluate(element => ({ autoplay: element.autoplay, paused: element.paused, source: element.getAttribute('src') }))).toEqual({ autoplay: false, paused: true, source: '/assets/video/furina-hero-1080p.mp4' });
});

test('navbar and hero remain bounded across target responsive widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  for (const width of [320, 375, 768, 1024, 1199, 1200, 1439, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 700 ? 780 : 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator('.site-header .brand-wordmark')).toBeVisible();
    await expect(page.locator('.hero h1')).toBeVisible();
    if (width >= 1200) {
      await expect(page.locator('.hero h1')).toHaveCSS('max-width', '658px');
      await expect(page.locator('.hero-cta')).toHaveCSS('width', '164px');
      await expect(page.locator('.hero-cta')).toHaveCSS('height', '47px');
    }
    const heroBox = await page.locator('.hero').boundingBox();
    const titleBox = await page.locator('.hero h1').boundingBox();
    expect(titleBox.x).toBeGreaterThanOrEqual(heroBox.x);
    expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(heroBox.x + heroBox.width + 1);
    if (width < 1200) {
      const toggle = page.getByRole('button', { name: 'Open menu' });
      await expect(toggle).toBeVisible(); await toggle.click();
      await expect(page.locator('.main-nav')).toHaveClass(/open/);
      await expect(page.locator('.mobile-nav-actions .collections-button')).toBeVisible();
    } else {
      await expect(page.locator('.main-nav')).toBeVisible();
      await expect(page.locator('.nav-actions .collections-button')).toBeVisible();
    }
  }
});

test('rolling controls preserve geometry, accessible names, and opposite icon motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.goto('/');
  const nav = page.locator('.main-nav > a').first(); const signIn = page.locator('.sign-in'); const collections = page.locator('.nav-actions .collections-button'); const hero = page.locator('.hero-cta');
  for (const control of [nav, signIn, collections, hero]) {
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
  expect(navRest.incomingText).toContain('-40');
  expect(navRest.incomingOrigin).not.toBe('50% 50%');
  expect(navRest.pillHeight).toBe('40px');
  expect(navRest.pillBackground).toBe('rgb(26, 26, 26)');
  expect(navRest.pillDuration).toBe('0.22s');
  expect(navRest.pillTiming).toBe('cubic-bezier(0.2, 0.7, 0.2, 1)');
  const before = await collections.boundingBox();
  await collections.hover();
  await expect(collections.locator('.roll-text-layer').first()).toHaveCSS('transition-delay', '0s');
  await expect(collections.locator('.roll-text-layer').last().locator('.roll-layer-content')).toHaveCSS('animation-name', 'none');
  await expect(collections.locator('.roll-icon-layer').last().locator('.roll-layer-content')).toHaveCSS('animation-name', 'none');
  await expect(collections).toHaveCSS('transform', 'none');
  await page.waitForTimeout(380);
  const motion = await collections.evaluate(element => ({ text: getComputedStyle(element.querySelector('.roll-text-layer')).transform, icon: getComputedStyle(element.querySelector('.roll-icon-layer')).transform, incomingText: getComputedStyle(element.querySelector('.roll-text-layer:last-child')).transform, incomingIcon: getComputedStyle(element.querySelector('.roll-icon-layer:last-child')).transform }));
  expect(motion.text).toContain('40'); expect(motion.icon).toContain('-40'); expect(motion.incomingText).toBe('matrix(1, 0, 0, 1, 0, 0)'); expect(motion.incomingIcon).toBe('matrix(1, 0, 0, 1, 0, 0)');
  const after = await collections.boundingBox(); expect({ width: after.width, height: after.height }).toEqual({ width: before.width, height: before.height });
  await nav.hover();
  await expect(nav.locator('.roll-text-layer').first()).toHaveCSS('transition-delay', '0s');
  await page.waitForTimeout(380);
  expect(await nav.evaluate(element => getComputedStyle(element.querySelector('.roll-text-layer:first-child')).transform)).toContain('40');
  const navAfter = await nav.boundingBox();
  expect({ width: navAfter.width, height: navAfter.height }).toEqual({ width: navBefore.width, height: navBefore.height });
  expect(await page.locator('.main-nav').evaluate(element => getComputedStyle(element).gap)).toBe(gapBefore);
  await page.locator('.hero').hover();
  await expect(collections.locator('.roll-text-layer').first()).toHaveCSS('transition-delay', '0s');
  await nav.focus(); await expect(nav.locator('.roll-text-layer').first()).toHaveCSS('transition-delay', '0s');
  expect(await nav.evaluate(element => getComputedStyle(element, '::before').transitionDelay)).toBe('0s');
});

test('rolling controls keep text and paired icons visible throughout pointer exit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
  await page.goto('/');
  const control = page.locator('.nav-actions .collections-button');
  await control.hover(); await page.waitForTimeout(380);
  const shellBefore = await control.boundingBox();
  await page.locator('.hero').hover();
  const samples = [];
  for (const delay of [0, 50, 100, 140]) {
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
  expect(final).toEqual({ textPrimary: 'matrix(1, 0, 0, 1, 0, 0)', textDuplicate: 'matrix(1, 0, 0, 1, 0, -40)', iconPrimary: 'matrix(1, 0, 0, 1, 0, 0)', iconDuplicate: 'matrix(1, 0, 0, 1, 0, 40)' });
  const shellAfter = await control.boundingBox();
  expect({ width: shellAfter.width, height: shellAfter.height }).toEqual({ width: shellBefore.width, height: shellBefore.height });
  const nav = page.locator('.main-nav > a').first();
  await nav.hover(); await page.waitForTimeout(240);
  await page.locator('.hero').hover();
  const pillStart = Number(await nav.evaluate(element => getComputedStyle(element, '::before').opacity));
  await page.waitForTimeout(240);
  const pillEnd = Number(await nav.evaluate(element => getComputedStyle(element, '::before').opacity));
  expect(pillStart).toBeGreaterThan(pillEnd);
  expect(pillEnd).toBe(0);
});

test('rolling controls and Lenis remain enhancement-only for touch and reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  const hero = page.locator('.hero-cta');
  await expect(hero.locator('.roll-text-layer').last()).toHaveCSS('visibility', 'hidden');
  expect(await page.locator('.main-nav > a').first().evaluate(element => getComputedStyle(element, '::before').transitionDuration)).toBe('0s');
  if (testInfo.project.name === 'mobile') {
    await hero.tap(); await expect(page).toHaveURL(/\/recent$/);
  }
});

test('Lenis pauses for dialogs while modal panels retain native scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop'); await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(200);
  const originalScroll = await page.evaluate(() => scrollY); expect(originalScroll).toBeGreaterThan(0);
  await page.locator('.main-nav a[href="/about"]').evaluate(element => element.click()); await expect(page).toHaveURL(/\/about$/); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
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
  await expect(page.getByRole('button', { name: 'Continue with Discord' })).toBeFocused();
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
  for (const [pathName, label] of [['/recent', 'Recently Added'], ['/icons', 'Icons'], ['/banners', 'Banners'], ['/animated', 'Animated'], ['/wallpapers', 'Wallpapers'], ['/search', 'Search'], ['/about', 'About']]) {
    const response = await request.get(pathName); expect(response.status()).toBe(200);
    await page.goto(pathName); await expect(page.locator(`.main-nav [data-nav="${pathName.slice(1)}"]`)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.site-header [aria-current="page"]')).toHaveCount(1);
  }
  await page.goto('/collections'); await expect(page.locator('.site-header [aria-current="page"]')).toHaveCount(1); await expect(page.locator('.site-header [data-nav="collections"][aria-current="page"]')).toHaveCount(1);
  await page.goto('/recent');
  const activeNav = page.locator('.main-nav [data-nav="recent"]');
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
  await expect(page.locator('footer .brand')).toHaveAccessibleName('Neuevault home');
  await expect(page.locator('.footer-legal')).toContainText('© 2026 Neuevault');

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
  await page.getByRole('button', { name: 'Sign in unavailable' }).last().click();
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
  await expect(page.locator('.sign-in:visible, .sign-in-mobile:visible').locator('.roll-text-layer').first()).toHaveText('Sign in');
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
  await expect(cards).toHaveCount(3);

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

test('collection cards preserve editorial geometry across pointer, focus, and exit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/collections');
  const card = page.locator('a[href="/collections/white-minimal-banners"]');
  const frame = card.locator('.collection-media-frame');
  const staticCover = card.locator('.cover-static');
  const animated = card.locator('.cover-animated');
  const matrixValue = (value, index) => Number.parseFloat(value.match(/^matrix\(([^)]+)\)$/)?.[1].split(',')[index] || (index === 0 ? 1 : 0));
  const state = () => card.evaluate(element => {
    const shell = getComputedStyle(element);
    const cover = element.querySelector('.collection-cover');
    const media = element.querySelector('.collection-media-frame');
    const staticLayer = element.querySelector('.cover-static');
    const animatedLayer = element.querySelector('.cover-animated');
    return {
      shellTransform: shell.transform,
      mediaTransform: getComputedStyle(media).transform,
      shellRadius: shell.borderRadius,
      mediaRadius: getComputedStyle(cover).borderRadius,
      border: shell.borderColor,
      staticOpacity: getComputedStyle(staticLayer).opacity,
      animatedOpacity: animatedLayer ? getComputedStyle(animatedLayer).opacity : null,
      outline: shell.outlineStyle,
    };
  });

  await expect(card).toHaveAccessibleName('White Banners Collection 11 Bright and minimal banners');
  await expect(staticCover).toBeVisible();
  expect(await state()).toMatchObject({ shellTransform: 'none', mediaTransform: 'matrix(1, 0, 0, 1, 0, 0)', shellRadius: '20px', mediaRadius: '15px', staticOpacity: '1', animatedOpacity: '0' });

  await card.hover();
  await expect(animated).toHaveAttribute('src', /nv-054\.gif$/);
  await expect(card).toHaveClass(/cover-playing/);
  await page.waitForTimeout(650);
  const hovered = await state();
  expect(matrixValue(hovered.shellTransform, 5)).toBeGreaterThanOrEqual(-4);
  expect(matrixValue(hovered.mediaTransform, 0)).toBeLessThanOrEqual(1.03);
  expect(hovered).toMatchObject({ staticOpacity: '0', animatedOpacity: '1' });

  await page.locator('.page-title').hover();
  await expect(card).not.toHaveClass(/cover-playing/);
  const exit = await state();
  expect(exit.staticOpacity).toBe('1');
  await page.waitForTimeout(250);
  await expect(animated).not.toHaveAttribute('src');
  await expect(frame).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await expect(card).toHaveCSS('transform', 'none');

  await card.focus();
  await expect(card).toBeFocused();
  await expect(card).toHaveCSS('outline-style', 'solid');
  await expect(animated).toHaveAttribute('src', /nv-054\.gif$/);
  await page.waitForTimeout(650);
  expect(matrixValue((await state()).mediaTransform, 0)).toBeLessThanOrEqual(1.03);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(250);
  await expect(animated).not.toHaveAttribute('src');
});

test('collection cards stay static for touch and reduced motion', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') {
    await page.goto('/collections');
    const card = page.locator('a[href="/collections/white-minimal-banners"]');
    const initialUrl = page.url();
    await expect(card.locator('.cover-static')).toBeVisible();
    await card.tap();
    await expect(page).toHaveURL(/\/collections\/white-minimal-banners$/);
    expect(page.url()).not.toBe(initialUrl);
    return;
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/collections');
  const card = page.locator('a[href="/collections/white-minimal-banners"]');
  const animated = card.locator('.cover-animated');
  await card.hover();
  await expect(card).toHaveCSS('transform', 'none');
  await expect(card.locator('.collection-media-frame')).toHaveCSS('transform', 'none');
  await expect(animated).not.toHaveAttribute('src');
  await expect(card.locator('.cover-static')).toBeVisible();
});

test('collection preview failures retain media geometry without blanking healthy static covers', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/collections');
  const staticCard = page.locator('a[href="/collections/noface-icons"]');
  const before = await staticCard.locator('.collection-cover').boundingBox();
  await staticCard.locator('.cover-static').evaluate(image => {
    image.src = '/missing-collection-preview.jpg';
  });
  await expect(staticCard.locator('.collection-cover')).toHaveClass(/image-error/);
  expect(await staticCard.locator('.collection-cover').evaluate(element => getComputedStyle(element, '::after').content)).toContain('Preview unavailable');
  const after = await staticCard.locator('.collection-cover').boundingBox();
  expect(Math.round(after.width)).toBe(Math.round(before.width));
  expect(Math.round(after.height)).toBe(Math.round(before.height));

  const animatedCard = page.locator('a[href="/collections/white-minimal-banners"]');
  const animated = animatedCard.locator('.cover-animated');
  await animated.evaluate(image => {
    image.dataset.animatedSrc = '/missing-collection-animation.gif';
  });
  await animatedCard.hover();
  await expect(animatedCard).not.toHaveClass(/cover-playing/);
  await expect(animatedCard.locator('.cover-static')).toBeVisible();
  await expect(animatedCard.locator('.collection-cover')).not.toHaveClass(/image-error/);
});

test('public animated cover loads only during hover or focus and returns static', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/collections'); const card = page.locator('a[href="/collections/white-minimal-banners"]'); const animated = card.locator('.cover-animated');
  await expect(animated).not.toHaveAttribute('src'); await card.hover();
  await expect(animated).toHaveAttribute('src', /nv-054\.gif$/); await expect(card).toHaveClass(/cover-playing/);
  await page.locator('.page-title').hover(); await expect(card).not.toHaveClass(/cover-playing/); await page.waitForTimeout(250); await expect(animated).not.toHaveAttribute('src');
  await card.focus(); await expect(animated).toHaveAttribute('src', /nv-054\.gif$/); await page.keyboard.press('Tab'); await page.waitForTimeout(250); await expect(card).not.toHaveClass(/cover-playing/);
});

test('reduced motion and restricted cover policy remain static', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const protectedRequests = []; page.on('request', request => { if (request.url().includes('/restricted/') || request.url().includes('/authenticated/')) protectedRequests.push(request.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/collections'); const card = page.locator('a[href="/collections/white-minimal-banners"]'); const animated = card.locator('.cover-animated');
  await card.hover(); await expect(animated).not.toHaveAttribute('src');
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
  await first.hover(); await page.waitForTimeout(700); const firstHover = await visual(first); expect(firstHover).toMatchObject({ opacity: '1', scale: 1, staticTransform: 'none', overlay: 'rgba(0, 0, 0, 0.08)' });
  await page.locator('.hero').hover(); await first.focus(); await page.waitForTimeout(700); expect((await visual(first))).toMatchObject({ opacity: '1', scale: 1 });
  await page.locator('.hero').hover(); await page.waitForTimeout(250); await fourth.hover(); await expect(fourth).toHaveClass(/cover-playing/); await page.waitForTimeout(700); const fourthHover = await fourth.locator('.cover-animated').evaluate(element => getComputedStyle(element).opacity);
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
    await expect(title).toHaveCSS('font-family', /SF Pro Rounded/); await expect(title).toHaveCSS('font-weight', '500'); await expect(title).toHaveCSS('font-size', '24px'); await expect(title).toHaveCSS('line-height', '29px');
    await expect(count).toHaveCSS('font-family', /SF Pro Rounded/); await expect(count).toHaveCSS('font-weight', '400'); await expect(count).toHaveCSS('font-size', '12px'); await expect(count).toHaveCSS('line-height', '29px');
    expect(await page.evaluate(() => document.fonts.check('500 24px "SF Pro Rounded"'))).toBe(true);
  } else {
    const media = card.locator('.cover-media');
    await expect(media).toHaveCSS('opacity', '1'); await expect(media).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    await expect(page.locator('a[href="/categories/matching"] .cover-animated')).not.toHaveAttribute('src');
    expect(await title.evaluate(element => element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.parentElement.clientHeight)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

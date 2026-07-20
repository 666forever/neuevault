import { expect, test } from '@playwright/test';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

test('mobile navigation keeps Collections and sign-in unavailable reachable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/'); await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.getByRole('link', { name: /Collections/ }).last()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in unavailable' }).last()).toBeVisible();
});

test('homepage navbar assets and hero media preserve routes and exact copy', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('.site-header .brand-logo');
  await expect(logo).toBeVisible();
  const logoShell = page.locator('.site-header .brand-logo-shell');
  expect(await logoShell.evaluate(element => { const style = getComputedStyle(element); return { width: style.width, height: style.height, radius: style.borderRadius, overflow: style.overflow, background: style.backgroundColor }; })).toEqual({ width: '54px', height: '28px', radius: '16px', overflow: 'hidden', background: 'rgb(18, 18, 18)' });
  await expect(logo).toHaveCSS('width', '18px');
  await expect(logo).toHaveCSS('height', '18px');
  await expect(page.locator('.brand-wordmark')).toHaveCSS('font-family', /TBJ Neuetra/);
  await expect(page.locator('.collections-button').first()).toHaveAttribute('href', '/collections');
  const eyebrow = page.locator('.hero-eyebrow');
  await expect(eyebrow).toHaveText('Meet pfseeker 2.0');
  await expect(eyebrow).toHaveCSS('font-family', /Archivo/);
  expect(await eyebrow.evaluate(element => ({ tag: element.tagName, tabindex: element.getAttribute('tabindex') }))).toEqual({ tag: 'P', tabindex: null });
  await expect(page.locator('.hero h1')).toHaveText('Discover the Best Banners on the internet. Literally.');
  await expect(page.locator('.hero h1')).toHaveCSS('font-family', /Arimo/);
  await expect(page.getByRole('link', { name: 'Get Full Access', exact: true })).toHaveAttribute('href', '/recent');
  const description = page.locator('.hero-description');
  expect((await description.textContent()).replace(/\s+/g, ' ').trim()).toBe('Stop digging through endless pages of repeats, trend-chasing, or whatever everyone else is already using. Browse alt, emo, dark, soft, strange, cute, messy, and the spaces where they cross. Let different aesthetics coexist. Identity forms in the borderland.');
  await expect(description).toHaveCSS('font-family', /Arimo/);
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

test('tracked variable fonts load without italic fallbacks', async ({ page }) => {
  const fontResponses = [];
  page.on('response', response => { if (response.url().includes('/fonts/')) fontResponses.push({ url: response.url(), status: response.status(), type: response.headers()['content-type'] || '' }); });
  await page.goto('/'); await page.evaluate(() => document.fonts.ready);
  for (const file of ['Archivo-VariableFont_wdth,wght.woff2', 'Arimo-VariableFont_wght.woff2', 'tbj-neuetra-vf.woff2']) {
    const response = fontResponses.find(item => item.url.endsWith(file));
    expect(response).toBeTruthy(); expect(response.status).toBe(200); expect(response.type).toContain('font/woff2');
  }
  expect(fontResponses.some(item => item.url.includes('Italic-VariableFont'))).toBe(false);
  expect(await page.locator('.brand-wordmark').evaluate(element => getComputedStyle(element).fontFamily)).toContain('TBJ Neuetra');
  expect(await page.locator('.hero h1').evaluate(element => getComputedStyle(element).fontFamily)).toContain('Arimo');
  expect(await page.locator('.hero-eyebrow').evaluate(element => getComputedStyle(element).fontFamily)).toContain('Archivo');
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
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation menu' }).click();
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
    await expect(page.locator('.brand-wordmark')).toBeVisible();
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
      const toggle = page.getByRole('button', { name: 'Open navigation menu' });
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
  expect(navRest.pillBackground).toBe('rgb(21, 21, 21)');
  expect(navRest.pillDuration).toBe('0.15s');
  expect(navRest.pillTiming).toBe('cubic-bezier(0.76, 0, 0.24, 1)');
  const before = await collections.boundingBox();
  await collections.hover();
  await expect(collections.locator('.roll-text-layer').first()).toHaveCSS('transition-delay', '0.01s');
  await expect(collections.locator('.roll-text-layer').last()).toHaveCSS('animation-name', 'roll-text-in-from-above');
  await expect(collections.locator('.roll-icon-layer').last()).toHaveCSS('animation-name', 'roll-icon-in-from-below');
  await expect(collections).toHaveCSS('transform', 'none');
  await page.waitForTimeout(380);
  const motion = await collections.evaluate(element => ({ text: getComputedStyle(element.querySelector('.roll-text-layer')).transform, icon: getComputedStyle(element.querySelector('.roll-icon-layer')).transform, incomingText: getComputedStyle(element.querySelector('.roll-text-layer:last-child')).transform, incomingIcon: getComputedStyle(element.querySelector('.roll-icon-layer:last-child')).transform }));
  expect(motion.text).toContain('40'); expect(motion.icon).toContain('-40'); expect(motion.incomingText).toBe('matrix(1, 0, 0, 1, 0, 0)'); expect(motion.incomingIcon).toBe('matrix(1, 0, 0, 1, 0, 0)');
  const after = await collections.boundingBox(); expect({ width: after.width, height: after.height }).toEqual({ width: before.width, height: before.height });
  await nav.hover();
  await expect(nav.locator('.roll-text-layer').first()).toHaveCSS('transition-delay', '0.01s');
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

test('clean routes, active navigation, deep links, and legacy migration work', async ({ page, request }) => {
  for (const [pathName, label] of [['/recent', 'Recently Added'], ['/icons', 'Icons'], ['/banners', 'Banners'], ['/animated', 'Animated'], ['/wallpapers', 'Wallpapers'], ['/search', 'Search'], ['/about', 'About']]) {
    const response = await request.get(pathName); expect(response.status()).toBe(200);
    await page.goto(pathName); await expect(page.locator(`.main-nav [data-nav="${pathName.slice(1)}"]`)).toHaveAttribute('aria-current', 'page');
  }
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

test('sign-in remains an unavailable boundary without backend requests', async ({ page }, testInfo) => {
  const protectedRequests = []; page.on('request', request => { if (request.url().includes('/api/') && !request.url().endsWith('/api/auth/session')) protectedRequests.push(request.url()); });
  await page.goto('/'); if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('button', { name: 'Sign in unavailable' }).last().click();
  await expect(page.locator('#auth-title')).toHaveText('Authentication unavailable'); expect(protectedRequests).toEqual([]);
});

test('authenticated session is reflected and logout is CSRF-protected', async ({ page }) => {
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
  await page.locator('.auth-logout').click(); await expect(signIn.locator('.roll-text-layer').first()).toHaveText('Sign in');
});

test('a directly linked restricted panel refreshes after session discovery', async ({ page }) => {
  await page.route('**/api/auth/session*', async route => {
    await new Promise(resolve => setTimeout(resolve, 80));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, authenticated: true, user: { id: 'discord-1', displayName: 'Vault Member', avatarUrl: null }, csrfToken: 'csrf-test' }) });
  });
  await page.goto('/asset/nv-166/restricted-test');
  await expect(page.locator('.download-action .roll-text-layer').first()).toHaveText('↓ Download restricted original');
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

test('category cards share base and hover visual treatment', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop'); await page.goto('/');
  const first = page.locator('a[href="/categories/ethereal"]'); const fourth = page.locator('a[href="/categories/matching"]');
  const visual = card => card.evaluate(element => { const style = getComputedStyle(element.querySelector('.cover-static')); return { opacity: style.opacity, filter: style.filter, border: getComputedStyle(element).borderColor, transform: style.transform, overlay: getComputedStyle(element, '::after').backgroundColor }; });
  expect(await visual(first)).toEqual(await visual(fourth)); expect((await visual(first)).opacity).toBe('0');
  await first.hover(); await page.waitForTimeout(700); const firstHover = await visual(first); expect(firstHover.opacity).toBe('1'); expect(firstHover.filter).toBe('none'); expect(firstHover.overlay).toBe('rgba(0, 0, 0, 0.08)');
  await page.locator('.hero').hover(); await first.focus(); await page.waitForTimeout(450); expect((await visual(first)).opacity).toBe('1');
  await page.locator('.hero').hover(); await page.waitForTimeout(250); await fourth.hover(); await expect(fourth).toHaveClass(/cover-playing/); await page.waitForTimeout(700); const fourthHover = await fourth.locator('.cover-animated').evaluate(element => getComputedStyle(element).opacity);
  expect(fourthHover).toBe('1');
  await expect(fourth.locator('.cover-animated')).toHaveAttribute('src', /nv-044\.gif$/);
});

test('category cards honor the Figma geometry and remain usable on touch', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: testInfo.project.name === 'desktop' ? 1920 : 320, height: 900 }); await page.goto('/');
  const grid = page.locator('.category-grid'); const card = page.locator('a[href="/categories/ethereal"]'); const title = card.locator('h2'); const count = card.locator('small');
  if (testInfo.project.name === 'desktop') {
    const geometry = await grid.evaluate(element => { const card = element.querySelector('.category-card'); const gridStyle = getComputedStyle(element); const cardStyle = getComputedStyle(card); const rect = card.getBoundingClientRect(); return { gridWidth: element.getBoundingClientRect().width, columns: gridStyle.gridTemplateColumns.split(' ').length, gap: gridStyle.gap, cardWidth: rect.width, cardHeight: rect.height, radius: cardStyle.borderRadius }; });
    expect(geometry).toEqual({ gridWidth: 1888, columns: 4, gap: '16px', cardWidth: 460, cardHeight: 478, radius: '20px' });
    await expect(title).toHaveCSS('font-family', /Arimo/); await expect(title).toHaveCSS('font-size', '24px'); await expect(title).toHaveCSS('line-height', '29px');
    await expect(count).toHaveCSS('font-family', /Arimo/); await expect(count).toHaveCSS('font-size', '12px'); await expect(count).toHaveCSS('line-height', '29px');
    expect(await page.evaluate(() => document.fonts.check('621 24px Arimo'))).toBe(true);
  } else {
    await expect(card.locator('.cover-static')).toHaveCSS('opacity', '1');
    expect(await title.evaluate(element => element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.parentElement.clientHeight)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

import { test, expect } from '@playwright/test';

const catalog = { baseCommitSha: null, source: 'local', readOnly: true, catalog: {
  assets: [{ id: 'nv-001', title: 'Public icon', category: 'Icons', sourceFile: 'icons/public.png', collectionSlugs: ['saved'], tags: [], animated: false, requiresDiscordAuth: false }, { id: 'nv-166', title: 'Restricted icon', category: 'Icons', sourceFile: 'icons/restricted.jpg', collectionSlugs: [], tags: [], animated: false, requiresDiscordAuth: true }],
  categories: [{ id: 'cat-001', slug: 'icons', title: 'Icons', coverAssetId: 'nv-166', visible: true, order: 0, filter: { type: 'folder', category: 'Icons' } }],
  collections: [{ id: 'col-001', slug: 'saved', title: 'Saved', description: '', coverAssetId: 'nv-001', tags: [], featured: true, featuredOrder: 1, public: true }],
} };

async function commonRoutes(page) {
  await page.route('**/api/auth/session*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"configured":true,"authenticated":false,"user":null,"csrfToken":null}' }));
}
async function adminRoutes(page, { status = 200, role = 'owner', delay = 0, catalogStatus = 200, delegated = [], manage = role === 'owner', mutationStatus = 200, writeCatalog = false, uploadAssets = false, uploadRestrictedAssets = false, publicationStatus = 202, verifyDeployments = false, verificationResults = [] } = {}) {
  let catalogRequests = 0; let delegatedRequests = 0; let uploadRequests=0;let verificationRequests=0; const uploadBodies=[];const rows = [...delegated];
  await page.route('**/api/admin/bootstrap', async route => {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    const body = status === 200 ? { authenticated: true, role, user: { id: role === 'owner' ? '900000000000000001' : '900000000000000002', displayName: role === 'owner' ? 'Local owner' : 'Local delegated admin', avatarUrl: null }, csrfToken: 'fixture', environment: 'test', readOnly: !writeCatalog, capabilities: { readCatalog: true, readDelegatedAdmins: role === 'owner', writeCatalog, manageDelegatedAdmins: manage, uploadAssets, uploadRestrictedAssets, verifyDeployments, deleteMedia: false } } : { error: status === 401 ? 'Authentication is required.' : status === 403 ? 'Administrator access is not authorized.' : 'Administration is unavailable.' };
    await route.fulfill({ status, contentType: 'application/json', headers: { 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
  });
  await page.route('**/api/admin/catalog', route => { catalogRequests += 1; return route.fulfill({ status: catalogStatus, contentType: 'application/json', headers: { 'Cache-Control': 'no-store' }, body: JSON.stringify(catalogStatus === 200 ? {...catalog,readOnly:!writeCatalog,baseCommitSha:'a'.repeat(40)} : { error: 'The administration catalog is unavailable.' }) }); });
  await page.route('**/api/admin/publications', route => route.fulfill({ status: publicationStatus, contentType: 'application/json', headers: { 'Cache-Control': 'no-store' }, body: JSON.stringify(publicationStatus===409?{code:'catalog_conflict'}:{publication:{publicationId:'pub-1',status:'deployment_pending',commitSha:'b'.repeat(40)}}) }));
  await page.route('**/api/admin/publications/pub-1/verify',route=>{verificationRequests++;const publication=verificationResults.shift()||{publicationId:'pub-1',status:'deployment_pending',live:false,retryable:true};return route.fulfill({status:publication.live?200:202,contentType:'application/json',headers:{'Cache-Control':'no-store'},body:JSON.stringify({publication})});});
  await page.route('**/api/admin/uploads',route=>{uploadRequests++;const requestBody=route.request().postDataJSON();uploadBodies.push(requestBody);const restricted=requestBody.requiresDiscordAuth===true,publicId=`neuevault/${restricted?'restricted':'public'}/icons/nv-999`;return route.fulfill({status:201,contentType:'application/json',headers:{'Cache-Control':'no-store'},body:JSON.stringify({job:{jobId:'job-1',assetId:'nv-999',status:'created',requiresDiscordAuth:restricted},authorization:{uploadUrl:'https://upload.fixture/image/upload',apiKey:'public-key',signature:'signed',parameters:{public_id:publicId,type:restricted?'authenticated':'upload'},expectedPublicId:publicId}})});});
  await page.route('https://upload.fixture/image/upload',route=>route.fulfill({status:200,contentType:'application/json',body:'{"version":1700000000}'}));
  await page.route('**/api/admin/uploads/job-1/finalize',route=>route.fulfill({status:202,contentType:'application/json',headers:{'Cache-Control':'no-store'},body:JSON.stringify({job:{jobId:'job-1',assetId:'nv-999',status:'deployment_pending',commitSha:'c'.repeat(40)}})}));
  const delegatedRoute = async route => {
    delegatedRequests += 1; const request = route.request(); const method = request.method(); const path = new URL(request.url()).pathname;
    if (method === 'GET') return route.fulfill({ status: mutationStatus === 503 ? 503 : 200, contentType: 'application/json', headers: { 'Cache-Control': 'no-store' }, body: JSON.stringify(mutationStatus === 503 ? { code: 'admin_database_unavailable' } : { owner: { id: '900000000000000001', permanent: true }, delegatedAdmins: rows }) });
    if (mutationStatus !== 200) return route.fulfill({ status: mutationStatus, contentType: 'application/json', body: JSON.stringify({ code: mutationStatus === 409 ? 'delegated_admin_exists' : 'admin_database_unavailable' }) });
    if (method === 'POST') { const { discordId } = request.postDataJSON(); if (discordId === '900000000000000001') return route.fulfill({ status: 400, contentType: 'application/json', body: '{"code":"delegated_admin_owner_permanent"}' }); if (rows.some(row => row.discordId === discordId)) return route.fulfill({ status: 409, contentType: 'application/json', body: '{"code":"delegated_admin_exists"}' }); rows.push({ discordId, createdBy: '900000000000000001', createdAt: '2026-08-05T00:00:00.000Z' }); return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ delegatedAdmin: rows.at(-1) }) }); }
    const discordId = decodeURIComponent(path.split('/').at(-1)); const index = rows.findIndex(row => row.discordId === discordId); if (index < 0) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"code":"delegated_admin_not_found"}' }); rows.splice(index, 1); return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ removed: true, discordId }) });
  };
  await page.route('**/api/admin/delegated-admins', delegatedRoute); await page.route('**/api/admin/delegated-admins/**', delegatedRoute);
  const result = () => catalogRequests; result.delegated = () => delegatedRequests;result.uploads=()=>uploadRequests;result.uploadBodies=()=>uploadBodies;result.verifications=()=>verificationRequests; return result;
}

test.beforeEach(async ({ page }) => commonRoutes(page));

test('signed-out admin state does not request catalog or reveal manager content', async ({ page }) => {
  const requests = await adminRoutes(page, { status: 401 }); await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Sign in required' })).toBeVisible(); await expect(page.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/api/auth/discord?returnTo=%2Fadmin');
  expect(requests()).toBe(0); await expect(page.getByRole('heading', { name: 'Content manager' })).toHaveCount(0);
});

test('unauthorized and unavailable states remain sanitized and retryable', async ({ page }) => {
  const scripts=[];page.on('response',response=>{if(response.request().resourceType()==='script')scripts.push(response.url());});let requests = await adminRoutes(page, { status: 403 }); await page.goto('/admin'); await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible(); expect(requests()).toBe(0);expect(scripts.some(url=>/AdminAssetUpload/i.test(url))).toBe(false);
  await page.unroute('**/api/admin/bootstrap'); await page.unroute('**/api/admin/catalog'); requests = await adminRoutes(page, { status: 503 }); await page.reload();
  await expect(page.getByRole('heading', { name: 'Administration unavailable' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible(); expect(requests()).toBe(0);expect(scripts.some(url=>/AdminAssetUpload/i.test(url))).toBe(false); await expect(page.locator('body')).not.toContainText(/ADMIN_DB|SELECT|stack|secret/i);
});

for (const role of ['owner', 'delegated']) test(`authorized ${role} receives one read-only catalog`, async ({ page }) => {
  const requests = await adminRoutes(page, { role }); await page.goto('/admin'); await expect(page.getByRole('heading', { name: 'Content manager' })).toBeVisible();
  await expect(page.locator('.admin-identity')).toContainText(role === 'owner' ? 'Owner' : 'Delegated administrator'); await expect(page.locator('.admin-summary')).toContainText('2');
  await expect(page.getByRole('button', { name: /save|delete|upload|publish/i })).toHaveCount(0); expect(requests()).toBe(1); await expect(page.locator('html')).not.toHaveCSS('overflow-x', 'scroll');
});

test('manager never flashes before authorization and route disposal ignores the pending response', async ({ page }) => {
  await adminRoutes(page, { delay: 800 }); await page.goto('/admin'); await expect(page.getByText('Checking access…')).toBeVisible(); await expect(page.getByRole('heading', { name: 'Content manager' })).toHaveCount(0);
  await page.getByRole('banner').getByRole('link', { name: 'Neuevault home' }).click(); await expect(page).toHaveURL('/'); await page.waitForTimeout(900); await expect(page.getByRole('heading', { name: 'Content manager' })).toHaveCount(0);
});

test('direct refresh and away/back navigation retain the lazy read-only route', async ({ page }) => {
  const requests = await adminRoutes(page); await page.goto('/admin'); await expect(page.getByRole('heading', { name: 'Content manager' })).toBeVisible(); await page.reload(); await expect(page.getByRole('heading', { name: 'Content manager' })).toBeVisible();
  await page.getByRole('banner').getByRole('link', { name: 'Neuevault home' }).click(); await page.goBack(); await expect(page.getByRole('heading', { name: 'Content manager' })).toBeVisible(); expect(requests()).toBe(3);
});

test('ordinary homepage does not request the admin feature chunk', async ({ page }) => {
  const scripts = []; page.on('response', response => { if (response.request().resourceType() === 'script') scripts.push(response.url()); }); await page.goto('/'); await expect(page.locator('.hero')).toBeVisible(); expect(scripts.some(url => /AdminPage|admin/i.test(url))).toBe(false);
});

test('admin chunk requests follow authorization and role boundaries', async ({ page }) => {
  const scripts = []; page.on('response', response => { if (response.request().resourceType() === 'script') scripts.push(response.url()); });
  await adminRoutes(page, { status: 401 }); await page.goto('/admin'); await expect(page.getByRole('heading', { name: 'Sign in required' })).toBeVisible(); expect(scripts.some(url => /AdminPage/i.test(url))).toBe(true); expect(scripts.some(url => /AdminAccess|AdminCatalogEditor|AdminAssetUpload/i.test(url))).toBe(false);
  await page.unrouteAll({ behavior: 'wait' }); await commonRoutes(page); await adminRoutes(page, { role: 'delegated' }); await page.reload(); await expect(page.getByText('You have delegated administrator access.')).toBeVisible(); expect(scripts.some(url => /AdminAccess|AdminAssetUpload/i.test(url))).toBe(false);
  await page.unrouteAll({ behavior: 'wait' }); await commonRoutes(page); await adminRoutes(page, { role: 'owner' }); await page.reload(); await expect(page.getByRole('heading', { name: 'Admin access' })).toBeVisible(); expect(scripts.some(url => /AdminAccess/i.test(url))).toBe(true); expect(scripts.some(url => /AdminAssetUpload/i.test(url))).toBe(false);
});

test('owner manages delegated access through validation, authoritative reload, and confirmation', async ({ page }) => {
  const existing = { discordId: '900000000000000010', createdBy: '900000000000000001', createdAt: '2026-08-01T00:00:00.000Z' }; const requests = await adminRoutes(page, { delegated: [existing] }); await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Admin access' })).toBeVisible(); await expect(page.getByText(existing.discordId)).toBeVisible(); await expect(page.getByText('Permanent owner')).toBeVisible(); expect(requests.delegated()).toBe(1);
  const input = page.getByLabel('Discord ID'); await input.fill('abc'); await page.getByRole('button', { name: 'Add access' }).click(); await expect(page.getByText('Enter a valid 17–20 digit Discord ID.')).toBeVisible();
  await input.fill('900000000000000011'); await page.getByRole('button', { name: 'Add access' }).click(); await expect(page.getByText('Delegated access added.')).toBeVisible(); await expect(page.getByText('900000000000000011')).toBeVisible(); expect(requests.delegated()).toBe(3);
  await page.getByRole('button', { name: `Remove delegated access for ${existing.discordId}` }).click(); await expect(page.getByText(`Remove delegated access for ${existing.discordId}?`)).toBeVisible(); await page.getByRole('button', { name: 'Cancel' }).click(); await expect(page.getByText(existing.discordId)).toBeVisible();
  await page.getByRole('button', { name: `Remove delegated access for ${existing.discordId}` }).click(); await page.getByRole('button', { name: 'Confirm' }).press('Enter'); await expect(page.getByText('Delegated access removed.')).toBeVisible(); await expect(page.getByText(existing.discordId)).toHaveCount(0); expect(requests.delegated()).toBe(5);
});

test('owner sees duplicate and permanent-owner errors without losing rows', async ({ page }) => {
  const existing = { discordId: '900000000000000010', createdBy: '900000000000000001', createdAt: '2026-08-01T00:00:00.000Z' }; await adminRoutes(page, { delegated: [existing] }); await page.goto('/admin'); const input = page.getByLabel('Discord ID');
  await input.fill(existing.discordId); await page.getByRole('button', { name: 'Add access' }).click(); await expect(page.getByText('This Discord ID already has delegated access.')).toBeVisible(); await expect(page.getByText(existing.discordId)).toBeVisible();
  await input.fill('900000000000000001'); await page.getByRole('button', { name: 'Add access' }).click(); await expect(page.getByText('The permanent owner cannot be delegated or removed.')).toBeVisible();
});

test('delegated and non-authorized states never request owner-management data', async ({ page }) => {
  let requests = await adminRoutes(page, { role: 'delegated' }); await page.goto('/admin'); await expect(page.getByText('You have delegated administrator access.')).toBeVisible(); await expect(page.getByLabel('Discord ID')).toHaveCount(0); expect(requests.delegated()).toBe(0);
  for (const status of [401, 403, 503]) { await page.unrouteAll({ behavior: 'wait' }); await commonRoutes(page); requests = await adminRoutes(page, { status }); await page.goto('/admin'); await page.waitForTimeout(50); expect(requests.delegated()).toBe(0); }
});

test('preview owner sees list without mutation controls and server failure is restrained', async ({ page }) => {
  const scripts=[];page.on('response',response=>{if(response.request().resourceType()==='script')scripts.push(response.url());});await adminRoutes(page, { delegated: [{ discordId: '900000000000000010', createdBy: '900000000000000001', createdAt: '2026-08-01T00:00:00.000Z' }], manage: false }); await page.goto('/admin'); await expect(page.getByText('Read-only here')).toBeVisible(); await expect(page.getByLabel('Discord ID')).toHaveCount(0); await expect(page.getByRole('button', { name: /remove delegated/i })).toHaveCount(0);expect(scripts.some(url=>/AdminAssetUpload/i.test(url))).toBe(false);
  await page.unrouteAll({ behavior: 'wait' }); await commonRoutes(page); await adminRoutes(page, { mutationStatus: 503 }); await page.reload(); await expect(page.getByText('Administrator access is unavailable. Retry by reloading the page.')).toBeVisible();
});

test('owner and delegated admins can publish typed catalog changes while conflicts preserve the editor', async ({ page }) => {
  await adminRoutes(page,{role:'delegated',writeCatalog:true}); await page.goto('/admin'); await expect(page.getByRole('heading',{name:'Catalog editor'})).toBeVisible(); await page.getByLabel('Title').fill('Updated category'); await page.getByRole('button',{name:'Publish change'}).click(); await expect(page.getByText(/Deployment is pending/)).toBeVisible();
  await page.unrouteAll({behavior:'wait'}); await commonRoutes(page); await adminRoutes(page,{role:'owner',writeCatalog:true,publicationStatus:409}); await page.reload(); await page.getByLabel('Title').fill('Unsaved title'); await page.getByRole('button',{name:'Publish change'}).click(); await expect(page.getByText(/Another catalog change/)).toBeVisible(); await expect(page.getByLabel('Title')).toHaveValue('Unsaved title'); await expect(page.getByRole('button',{name:/upload|delete asset/i})).toHaveCount(0);
});

test('deployment verification stays lazy, transitions to live, and refreshes authoritative catalog',async({page})=>{const scripts=[];page.on('response',response=>{if(response.request().resourceType()==='script')scripts.push(response.url());});const requests=await adminRoutes(page,{writeCatalog:true,verifyDeployments:true,verificationResults:[{publicationId:'pub-1',status:'live',live:true,retryable:false}]});await page.goto('/admin');expect(scripts.some(url=>/AdminPublicationStatus/.test(url))).toBe(false);await page.getByRole('button',{name:'Publish change'}).click();await expect.poll(()=>requests.verifications()).toBe(1);await expect.poll(()=>requests()).toBeGreaterThanOrEqual(2);expect(scripts.some(url=>/AdminPublicationStatus/.test(url))).toBe(true);});

for(const role of ['owner','delegated'])test(`${role} can complete the lazy public upload flow`,async({page})=>{const requests=await adminRoutes(page,{role,writeCatalog:true,uploadAssets:true});const scripts=[];page.on('response',response=>{if(response.request().resourceType()==='script')scripts.push(response.url());});await page.goto('/admin');await expect(page.getByRole('button',{name:'Upload asset'})).toBeVisible();expect(scripts.some(url=>/AdminAssetUpload/.test(url))).toBe(false);await page.getByRole('button',{name:'Upload asset'}).click();await expect(page.getByRole('heading',{name:'Upload asset'})).toBeVisible();expect(scripts.filter(url=>/AdminAssetUpload/.test(url))).toHaveLength(1);await page.getByLabel('Image').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('mock png')});await page.getByLabel('Title').last().fill('Uploaded fixture');await page.getByRole('button',{name:'Upload asset'}).last().click();await expect(page.getByText(/Deployment is pending/)).toBeVisible();expect(requests.uploads()).toBe(1);await expect(page.locator('.admin-upload')).not.toContainText(/restricted|delete/i);});

test('restricted upload choice is capability gated and sends only the access intent',async({page})=>{const requests=await adminRoutes(page,{role:'delegated',writeCatalog:true,uploadAssets:true,uploadRestrictedAssets:true});await page.goto('/admin');await page.getByRole('button',{name:'Upload asset'}).click();await page.getByLabel('Access').selectOption('Restricted');await expect(page.getByText(/static preview/i)).toBeVisible();await page.getByLabel('Image').setInputFiles({name:'fixture.gif',mimeType:'image/gif',buffer:Buffer.from('mock gif')});await page.getByRole('button',{name:'Upload asset'}).last().click();await expect(page.getByText(/Deployment is pending/)).toBeVisible();expect(requests.uploadBodies()[0]).toMatchObject({requiresDiscordAuth:true,declaredFile:{format:'gif'}});expect(JSON.stringify(requests.uploadBodies()[0])).not.toMatch(/publicId|deliveryType|transformation|sourceUrl/i);});

export class AdminClient {
  constructor(fetcher = (...args) => fetch(...args)) { this.fetcher = fetcher; }
  async bootstrap(signal) { return this.fetcher('/api/admin/bootstrap', { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal }); }
  async catalog(signal) { return this.fetcher('/api/admin/catalog', { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal }); }
  async mutate(path, body, csrfToken, idempotencyKey, signal) { return this.fetcher(path, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(body), signal }); }
  async publish(body, csrfToken, idempotencyKey, signal) { return this.mutate('/api/admin/publications', body, csrfToken, idempotencyKey, signal); }
  async publication(publicationId, signal) { return this.fetcher(`/api/admin/publications/${encodeURIComponent(publicationId)}`, { method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal }); }
  async verifyPublication(publicationId,csrfToken,signal){return this.mutate(`/api/admin/publications/${encodeURIComponent(publicationId)}/verify`,{},csrfToken,crypto.randomUUID(),signal);}
}

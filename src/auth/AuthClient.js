export class AuthClient extends EventTarget {
  constructor(fetcher = (...args) => fetch(...args)) { super(); this.fetcher = fetcher; this.state = { loading: true, configured: false, authenticated: false, user: null, csrfToken: null }; }
  async load() {
    try {
      const response = await this.fetcher('/api/auth/session', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.state = { loading: false, ...await response.json() };
    } catch { this.state = { loading: false, configured: false, authenticated: false, user: null, csrfToken: null }; }
    this.dispatchEvent(new Event('change')); return this.state;
  }
  signIn(returnTo = '/') { location.assign(`/api/auth/discord?returnTo=${encodeURIComponent(returnTo)}`); }
  async logout() {
    const response = await this.fetcher('/api/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': this.state.csrfToken || '' }, body: '{}' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    this.state = { loading: false, configured: this.state.configured, authenticated: false, user: null, csrfToken: null };
    this.dispatchEvent(new Event('change'));
  }
}

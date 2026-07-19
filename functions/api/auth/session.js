import { authConfigured, currentSession } from '../../../server/auth.js';
import { json } from '../../../server/http.js';

export async function onRequestGet({ request, env }) {
  const session = await currentSession(request, env);
  return json({ configured: authConfigured(env), authenticated: Boolean(session), user: session?.user || null, csrfToken: session?.csrf || null });
}

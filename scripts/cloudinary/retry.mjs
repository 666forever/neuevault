const transientCodes = new Set([408, 425, 429, 500, 502, 503, 504]);
export async function withRetry(operation, { attempts = 3, baseDelayMs = 150 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await operation(attempt); } catch (error) {
      lastError = error; const status = error.http_code || error.status || error.statusCode;
      if (attempt === attempts || (status && !transientCodes.has(status))) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}

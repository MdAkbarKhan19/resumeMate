/**
 * Global JSON-parse guard (client-side, install-once).
 *
 * Problem: anywhere in the app that does `await response.json()` will throw the
 * cryptic `SyntaxError: Unexpected token '<', "<html> <h"... is not valid JSON`
 * whenever the body isn't JSON — which happens for reasons that have nothing to
 * do with the calling code:
 *   - nginx/proxy returns an HTML 502 (app down/OOM) or 504 (timeout) page
 *   - a gateway/CDN returns a plain-text or HTML error
 *   - the body is empty (204/empty 200) → "Unexpected end of JSON input"
 *   - a response is truncated mid-stream
 *
 * Rather than hunt down every `.json()` call (and hope no new one is ever added),
 * we patch `Response.prototype.json` ONCE so the failure mode is uniform and
 * human-readable everywhere — including third-party code and any future call site.
 *
 * Semantics are otherwise identical: a valid JSON body still parses and returns
 * exactly as before; a non-JSON body still REJECTS (so existing try/catch and
 * `if (!response.ok)` paths behave the same) — only the error message changes,
 * from the raw SyntaxError to a status-aware, user-facing one.
 */

function installJsonGuard(): void {
  if (typeof window === 'undefined') return; // client only
  const w = window as unknown as { __jsonGuardInstalled?: boolean };
  if (w.__jsonGuardInstalled) return;
  w.__jsonGuardInstalled = true;

  const originalJson = Response.prototype.json;

  Response.prototype.json = async function patchedJson(this: Response) {
    try {
      // Fast path: a well-formed JSON body parses exactly as before.
      return await originalJson.call(this);
    } catch {
      // The body was not valid JSON. Translate the raw SyntaxError into a clear,
      // status-aware message. We still throw, so callers' error handling is
      // unchanged — they just get a message worth showing a user.
      const status = this?.status ?? 0;
      if (status === 504 || status === 408) {
        throw new Error(
          'This is taking longer than the server allows and timed out. Please try again — large resumes can take up to a minute.',
        );
      }
      if (status === 502 || status === 503) {
        throw new Error(
          'The server is temporarily unavailable (it may be busy). Please wait a moment and try again.',
        );
      }
      if (status >= 500) {
        throw new Error('Something went wrong on our end. Please try again shortly.');
      }
      if (status === 401 || status === 403) {
        throw new Error('Your session has expired. Please sign in again.');
      }
      // 2xx/4xx with a non-JSON or empty body.
      throw new Error('Unexpected response from the server. Please try again.');
    }
  };
}

installJsonGuard();

export {};

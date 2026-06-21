/**
 * API Client Utilities
 * Helper functions for making authenticated API calls
 */

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('[API Client] No auth token found in localStorage');
  }

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Make an authenticated API request.
 *
 * Note: this no longer auto-redirects on 401. A single 401 from a transient
 * cause (background fetch, image, slow request) would otherwise nuke the
 * user's session mid-action. Callers decide how to react; the AuthContext
 * handles real session expiry on the next /api/auth/me probe.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Parse a fetch Response as JSON, but fail with a clear, user-facing message
 * when the body isn't JSON.
 *
 * Long AI/export requests can hit an nginx/proxy 504 (or a 502 if the box is
 * momentarily down) whose body is an HTML error page. Calling response.json()
 * on that throws the cryptic "Unexpected token '<', "<html>..." error straight
 * into the UI. This detects a non-JSON body and surfaces something actionable
 * instead. Use it for the slow endpoints (AI, ATS, JD analyze, export).
 */
export async function readJson<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (response.status === 504 || response.status === 502 || /<html|<!doctype/i.test(text)) {
      throw new Error(
        'This is taking longer than the server allows and timed out. Please try again — large resumes can take up to a minute.',
      );
    }
    throw new Error(`Unexpected server response (${response.status}). Please try again.`);
  }
}

/**
 * Make an authenticated API request and parse JSON
 */
export async function authenticatedFetchJSON<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: any }> {
  const response = await authenticatedFetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `API request failed: ${response.status}`);
  }

  return data;
}

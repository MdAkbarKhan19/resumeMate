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

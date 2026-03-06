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
 * Make an authenticated API request
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 errors (token expired)
  if (response.status === 401) {
    console.warn('[API Client] 401 Unauthorized - Token may be expired');
    
    // Clear the expired token
    localStorage.removeItem('token');
    
    // Redirect to login if not already there
    if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
      console.log('[API Client] Redirecting to login...');
      window.location.href = '/auth/login?reason=session-expired';
    }
  }

  return response;
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

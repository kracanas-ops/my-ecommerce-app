const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error(`Unable to reach the store API: ${error.message}`, { cause: error });
  }

  const responseText = await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('The store API returned an invalid response.');
    }
  }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/api/users/login') && !path.startsWith('/api/users/register')) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userProfile');
      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
    }
    throw new Error(data?.error || `The request failed (${response.status}).`);
  }
  return data;
}

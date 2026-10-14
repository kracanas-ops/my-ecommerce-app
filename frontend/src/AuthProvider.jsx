import { useMemo, useState } from 'react';
import { apiRequest } from './api';
import { AuthContext } from './AuthContext';

function readStoredUser() {
  const token = localStorage.getItem('userToken');
  const serializedUser = localStorage.getItem('userProfile');
  if (!token || !serializedUser) {
    return { token: null, user: null };
  }
  try {
    return { token, user: JSON.parse(serializedUser) };
  } catch {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userProfile');
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredUser);

  async function authenticate(endpoint, credentials) {
    const result = await apiRequest(`/api/users/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    localStorage.setItem('userToken', result.token);
    localStorage.setItem('userProfile', JSON.stringify(result.user));
    setAuth({ token: result.token, user: result.user });
    return result.user;
  }

  function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userProfile');
    setAuth({ token: null, user: null });
  }

  const value = useMemo(() => ({
    ...auth,
    login: (credentials) => authenticate('login', credentials),
    register: (credentials) => authenticate('register', credentials),
    logout
  }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import React, { useEffect, useState } from 'react';
import AuthContext from './authCore';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('emp_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('emp_token') || null);

  useEffect(() => {
    if (user) localStorage.setItem('emp_user', JSON.stringify(user));
    else localStorage.removeItem('emp_user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('emp_token', token);
    else localStorage.removeItem('emp_token');
  }, [token]);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
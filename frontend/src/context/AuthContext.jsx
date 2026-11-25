import React, { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('indila_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('indila_token');
    if (!token) {
      setLoading(false);
      return;
    }
    client.get('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('indila_user', JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem('indila_token');
        localStorage.removeItem('indila_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    localStorage.setItem('indila_token', res.data.token);
    localStorage.setItem('indila_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await client.post('/auth/register', payload);
    localStorage.setItem('indila_token', res.data.token);
    localStorage.setItem('indila_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('indila_token');
    localStorage.removeItem('indila_user');
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const res = await client.put('/auth/me', payload);
    setUser(res.data);
    localStorage.setItem('indila_user', JSON.stringify(res.data));
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

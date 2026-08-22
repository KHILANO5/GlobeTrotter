import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Initialize and check if token is valid on reload
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const data = await api.get('/user/profile');
          setUser(data.user);
        } catch (err) {
          console.error('Failed to restore user session:', err.message);
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const data = await api.post('/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const data = await api.post('/register', formData);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

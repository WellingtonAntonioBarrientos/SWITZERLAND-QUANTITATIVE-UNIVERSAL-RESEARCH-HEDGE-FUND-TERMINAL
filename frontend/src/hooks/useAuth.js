import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../utils/api';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('quantflow_token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const res = await axios.get(`${API}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAuthenticated(true);
      setUserEmail(res.data.email);
    } catch (e) {
      localStorage.removeItem('quantflow_token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('quantflow_token', res.data.token);
    setIsAuthenticated(true);
    setUserEmail(res.data.email);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('quantflow_token');
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return { isAuthenticated, loading, userEmail, login, logout };
};

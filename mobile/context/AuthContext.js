import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const AuthContext = createContext();

// Cross-platform storage (AsyncStorage works on both native and web for Expo SDK 54)
const storage = {
  async getItem(key) {
    try { return await AsyncStorage.getItem(key); } catch { return null; }
  },
  async setItem(key, value) {
    try { await AsyncStorage.setItem(key, value); } catch {}
  },
  async removeItem(key) {
    try { await AsyncStorage.removeItem(key); } catch {}
  }
};

// Mirror the web app role-based redirect logic
export const getPostAuthRoute = (user) => {
  if (!user) return '/login';
  if (user.role === 'admin') return '/(tabs)/admin';
  if (user.role === 'instructor') return '/(tabs)/instructor';
  return '/(tabs)';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const savedUser = await storage.getItem('userInfo');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {
      console.log('Error checking login status', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    // userData is the full object from API: { _id, name, email, role, token, ... }
    await storage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await storage.removeItem('userInfo');
      setUser(null);
      // Optional: Clear any other persistent data if needed
    } catch (e) {
      console.error('Logout error:', e);
      setUser(null); // Force clear state even if storage fails
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { AuthContext };

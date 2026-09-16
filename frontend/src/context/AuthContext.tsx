import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { authService } from '../api/services';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role: UserRole; class_name?: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async (): Promise<User | null> => {
    const token = localStorage.getItem('onepath_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const userData = await authService.getMe();
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (err) {
      console.error("Auth initialization failed:", err);
      localStorage.removeItem('onepath_token');
      setUser(null);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const { access_token } = await authService.login(email, password);
      localStorage.setItem('onepath_token', access_token);
      const userData = await authService.getMe();
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (data: { name: string; email: string; password: string; role: UserRole; class_name?: string }): Promise<User> => {
    setLoading(true);
    try {
      await authService.register(data);
      const { access_token } = await authService.login(data.email, data.password);
      localStorage.setItem('onepath_token', access_token);
      const userData = await authService.getMe();
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('onepath_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: fetchCurrentUser }}>
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

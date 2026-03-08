import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, mockUsers } from './mock-data';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('trailerrent_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email: string, _password: string) => {
    const found = mockUsers.find(u => u.email === email);
    if (found) {
      setUser(found);
      localStorage.setItem('trailerrent_user', JSON.stringify(found));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('trailerrent_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

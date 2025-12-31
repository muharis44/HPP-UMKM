import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data, error } = await api.auth.getCurrentUser();
    if (!error && data?.user) {
      setUser(data.user);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await api.auth.login(email, password);
    if (error) {
      return { error: new Error(error) };
    }
    if (data?.user) {
      setUser(data.user);
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await api.auth.register(email, password, fullName);
    if (error) {
      return { error: new Error(error) };
    }
    if (data?.user) {
      setUser(data.user);
    }
    return { error: null };
  };

  const signOut = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

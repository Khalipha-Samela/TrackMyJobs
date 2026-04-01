import { useState, useEffect, createContext, useContext } from 'react';
import { signIn, signUp, signOut, getCurrentUser } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const user = await getCurrentUser();
    setUser(user);
    setLoading(false);
  };

  const login = async (email, password) => {
    const data = await signIn(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (email, password, displayName) => {
    const data = await signUp(email, password, displayName);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
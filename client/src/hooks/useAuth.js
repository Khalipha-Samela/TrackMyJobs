import { useState, useEffect, createContext, useContext } from 'react';
import { login, register, logout, getCurrentUser } from '../services/supabase';

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

  const signIn = async (email, password) => {
    const { user } = await login(email, password);
    setUser(user);
    return { user };
  };

  const signUp = async (email, password, displayName) => {
    const { user } = await register(email, password, displayName);
    setUser(user);
    return { user };
  };

  const signOut = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login: signIn, 
        register: signUp, 
        logout: signOut, 
        isAuthenticated: !!user 
      }}
    >
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
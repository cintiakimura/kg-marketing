import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCurrentUser,
  login as authLogin,
  logout as authLogout,
  clearSession,
  getStoredUser,
  getStoredToken,
} from '@/api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      if (!getStoredToken()) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      clearSession();
      setUser(null);
      setIsAuthenticated(false);
      if (error?.status === 401 || error?.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Please sign in' });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    const cached = getStoredUser();
    if (cached && getStoredToken()) {
      setUser(cached);
      setIsAuthenticated(true);
    }
    checkUserAuth();
  }, [checkUserAuth]);

  const login = async (email, password) => {
    setAuthError(null);
    const { user: loggedInUser } = await authLogin(email, password);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    return loggedInUser;
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await authLogout();
    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authError,
        login,
        logout,
        navigateToLogin,
        checkAppState: checkUserAuth,
      }}
    >
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

/** Hook for post-login navigation (must be inside Router). */
export function useAuthNavigate() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const loginAndGoToDashboard = async (email, password) => {
    await login(email, password);
    navigate('/dashboard', { replace: true });
  };

  const logoutAndGoHome = async () => {
    await logout(false);
    navigate('/', { replace: true });
  };

  return { loginAndGoToDashboard, logoutAndGoHome };
}

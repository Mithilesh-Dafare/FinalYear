"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType<T = User> {
  isAuthenticated: boolean;
  userData: T | null;
  login: (token: string, userData: T) => void;
  logout: () => void;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for existing auth state on mount
    console.log('[AuthContext] Checking for existing auth state...');
    
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const token = getCookie("token");
    const storedUserData = getCookie("user_data");
    
    console.log('[AuthContext] Token found:', token ? 'Yes' : 'No');
    console.log('[AuthContext] User data found:', storedUserData ? 'Yes' : 'No');

    if (token && storedUserData) {
      console.log('[AuthContext] Both token and user data found, setting auth state...');
      try {
        const userData = JSON.parse(decodeURIComponent(storedUserData));
        console.log('[AuthContext] User data parsed successfully');
        setIsAuthenticated(true);
        setUserData(userData);
        
        // Optional: Validate token with server in background (non-blocking)
        fetch('/api/auth/check', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          if (!response.ok) {
            console.log('[AuthContext] Background token validation failed, clearing auth state');
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            setIsAuthenticated(false);
            setUserData(null);
          } else {
            console.log('[AuthContext] Background token validation successful');
          }
        })
        .catch(error => {
          console.error('[AuthContext] Background token validation error:', error);
          // Don't clear auth state on network errors during background validation
        });
      } catch (error) {
        console.error("[AuthContext] Error parsing user data:", error);
        // Clear invalid cookies
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setIsAuthenticated(false);
        setUserData(null);
      }
    } else {
      console.log('[AuthContext] No valid auth state found');
      // Clear any orphaned cookies to prevent inconsistent state
      if (token && !storedUserData) {
        console.log('[AuthContext] Clearing orphaned token cookie');
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      if (!token && storedUserData) {
        console.log('[AuthContext] Clearing orphaned user_data cookie');
        document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      setIsAuthenticated(false);
      setUserData(null);
    }
  }, []);

  const getToken = async (): Promise<string | null> => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1] || null;
    
    // If no token found, ensure user is logged out
    if (!token && isAuthenticated) {
      console.log('[AuthContext] Token missing but user appears authenticated, logging out');
      logout();
      return null;
    }
    
    return token;
  };

  const login = (token: string, userData: User) => {
    console.log('[AuthContext] Login function called with:', { token: token.substring(0, 20) + '...', userData });
    
    // Clear any existing cookies first
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    console.log('[AuthContext] Cleared existing cookies');
    
    // Set cookies with proper expiration (7 days to match JWT)
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    
    // Set token cookie (no Secure flag for localhost, relaxed SameSite)
    const tokenCookie = `token=${token}; expires=${expires}; path=/; SameSite=Lax`;
    document.cookie = tokenCookie;
    console.log('[AuthContext] Token cookie set:', tokenCookie.substring(0, 50) + '...');
    
    // Set user data cookie (no Secure flag for localhost, relaxed SameSite)
    const userDataCookie = `user_data=${encodeURIComponent(JSON.stringify(userData))}; expires=${expires}; path=/; SameSite=Lax`;
    document.cookie = userDataCookie;
    console.log('[AuthContext] User data cookie set');
    
    // Verify cookies were set
    setTimeout(() => {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      const verifyToken = getCookie("token");
      const verifyUserData = getCookie("user_data");
      console.log('[AuthContext] Cookie verification:', { 
        token: verifyToken ? 'Present' : 'Missing', 
        userData: verifyUserData ? 'Present' : 'Missing' 
      });
    }, 100);
    
    console.log('[AuthContext] Updating state...');
    setIsAuthenticated(true);
    setUserData(userData);
    console.log('[AuthContext] State updated - isAuthenticated: true');
    
    // Force a small delay to ensure state is propagated
    setTimeout(() => {
      console.log('[AuthContext] State propagation complete');
    }, 50);
  };

  const logout = () => {
    // Clear cookies by setting them to expire in the past
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    setIsAuthenticated(false);
    setUserData(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userData, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

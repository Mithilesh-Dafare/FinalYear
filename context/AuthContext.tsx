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
  isLoading: boolean;
  userData: T | null;
  login: (token: string, userData: T) => void;
  logout: () => void;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

    let token = getCookie("token");
    let storedUserData = getCookie("user_data");
    
    // Fallback to localStorage if cookies are not available
    if (!token) {
      token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    }
    if (!storedUserData) {
      const localUserData = localStorage.getItem("user_data");
      if (localUserData) {
        storedUserData = localUserData;
      }
    }
    
    console.log('[AuthContext] Token found:', token ? 'Yes' : 'No');
    console.log('[AuthContext] User data found:', storedUserData ? 'Yes' : 'No');

    if (token && storedUserData) {
      console.log('[AuthContext] Both token and user data found, setting auth state...');
      try {
        // Try to parse user data - handle both cookie (encoded) and localStorage (not encoded) formats
        let userData;
        try {
          userData = JSON.parse(decodeURIComponent(storedUserData));
        } catch {
          // If decoding fails, try parsing directly (localStorage format)
          userData = JSON.parse(storedUserData);
        }
        console.log('[AuthContext] User data parsed successfully');
        setIsAuthenticated(true);
        setUserData(userData);
        
        // Optional: Validate token with server in background (non-blocking)
        // Temporarily disabled to prevent auth state clearing issues
        /*
        fetch('/api/auth/check', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          if (!response.ok) {
            console.log('[AuthContext] Background token validation failed with status:', response.status);
            // Only clear auth state for definitive authentication failures (401, 403)
            if (response.status === 401 || response.status === 403) {
              console.log('[AuthContext] Token is invalid, clearing auth state');
              document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              localStorage.removeItem("auth_token");
              localStorage.removeItem("token");
              localStorage.removeItem("user_data");
              setIsAuthenticated(false);
              setUserData(null);
            } else {
              console.log('[AuthContext] Non-auth error during validation, keeping auth state');
            }
          } else {
            console.log('[AuthContext] Background token validation successful');
          }
        })
        .catch(error => {
          console.error('[AuthContext] Background token validation error:', error);
          // Don't clear auth state on network errors during background validation
        });
        */
      } catch (error) {
        console.error("[AuthContext] Error parsing user data:", error);
        // Clear invalid cookies and localStorage
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem("auth_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user_data");
        setIsAuthenticated(false);
        setUserData(null);
      }
    } else {
      console.log('[AuthContext] No valid auth state found');
      // Clear any orphaned cookies and localStorage to prevent inconsistent state
      if (token && !storedUserData) {
        console.log('[AuthContext] Clearing orphaned token');
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem("auth_token");
        localStorage.removeItem("token");
      }
      if (!token && storedUserData) {
        console.log('[AuthContext] Clearing orphaned user_data');
        document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem("user_data");
      }
      setIsAuthenticated(false);
      setUserData(null);
    }
    
    // Set loading to false after initial auth check
    setIsLoading(false);
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
    
    // Clear any existing cookies and localStorage first
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user_data");
    console.log('[AuthContext] Cleared existing cookies and localStorage');
    
    // Set cookies with proper expiration (7 days to match JWT)
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    
    // 1. SET COOKIES (Existing code)
    const tokenCookie = `token=${token}; expires=${expires}; path=/; SameSite=Strict`;
    document.cookie = tokenCookie;
    console.log('[AuthContext] Token cookie set:', tokenCookie.substring(0, 50) + '...');
    
    const userDataCookie = `user_data=${encodeURIComponent(JSON.stringify(userData))}; expires=${expires}; path=/; SameSite=Strict`;
    document.cookie = userDataCookie;
    console.log('[AuthContext] User data cookie set');
    
    // 2. SET LOCALSTORAGE (Add these lines for compatibility)
    localStorage.setItem("auth_token", token); // For NewInterviewForm.tsx
    localStorage.setItem("token", token); // For InterviewSession.tsx
    localStorage.setItem("user_data", JSON.stringify(userData));
    console.log('[AuthContext] Token and user data saved to localStorage');
    
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
      const verifyLocalStorageToken = localStorage.getItem("auth_token");
      console.log('[AuthContext] Storage verification:', { 
        cookieToken: verifyToken ? 'Present' : 'Missing', 
        cookieUserData: verifyUserData ? 'Present' : 'Missing',
        localStorageToken: verifyLocalStorageToken ? 'Present' : 'Missing'
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
    console.log('[AuthContext] Logout function called');
    
    // Clear cookies by setting them to expire in the past
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Clear localStorage (Add these lines)
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user_data");
    
    console.log('[AuthContext] Cleared all cookies and localStorage');
    
    setIsAuthenticated(false);
    setUserData(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userData, login, logout, getToken }}>
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

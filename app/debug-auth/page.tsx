"use client";

import { useAuth } from "@/context/AuthContext";

export default function DebugAuthPage() {
  const { isAuthenticated, userData } = useAuth();

  const testCookies = () => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const token = getCookie("token");
    const userDataCookie = getCookie("user_data");

    console.log('Cookie test:', {
      token: token ? token.substring(0, 20) + '...' : null,
      userData: userDataCookie,
      allCookies: document.cookie
    });
  };

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}
        </div>
        
        <div>
          <strong>userData:</strong> {userData ? JSON.stringify(userData, null, 2) : 'null'}
        </div>
        
        <button 
          onClick={testCookies}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          Test Cookies (Check Console)
        </button>
        
        <div>
          <strong>All cookies:</strong> {typeof window !== 'undefined' ? document.cookie : 'N/A'}
        </div>
      </div>
    </div>
  );
}

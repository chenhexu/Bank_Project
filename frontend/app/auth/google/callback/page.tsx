"use client";

import { useEffect } from 'react';

export default function GoogleCallback() {
  useEffect(() => {
    const handleCallback = () => {
      try {
        console.log("🔵 Callback page loaded");
        console.log("🔵 Current URL:", window.location.href);
        console.log("🔵 Hash:", window.location.hash);
        console.log("🔵 Search:", window.location.search);
        
        // Get parameters from both fragment (#) and query (?)
        const hash = window.location.hash.substring(1);
        const search = window.location.search.substring(1);
        
        // Try both hash and search parameters
        let params = new URLSearchParams(hash);
        if (!params.has('access_token') && !params.has('id_token') && !params.has('error')) {
          params = new URLSearchParams(search);
        }
        
        const accessToken = params.get('access_token');
        const idToken = params.get('id_token');
        const error = params.get('error');

        console.log("🔵 Google callback received:");
        console.log("🔵 Access Token:", accessToken ? "Present" : "Missing");
        console.log("🔵 ID Token:", idToken ? "Present" : "Missing");
        console.log("🔵 Error:", error);

        if (error) {
          // Send error to parent window
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: error
          }, window.location.origin);
        } else if (idToken) {
          // Send success with ID token to parent window
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_SUCCESS',
            id_token: idToken,
            access_token: accessToken
          }, window.location.origin);
        } else {
          // No token received
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: 'No ID token received'
          }, window.location.origin);
        }

        // Close the popup
        window.close();
      } catch (error) {
        console.error('🔴 Error in Google callback:', error);
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: 'Callback processing failed'
        }, window.location.origin);
        window.close();
      }
    };

    // Run the callback handler with a small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      handleCallback();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing Google authentication...</p>
      </div>
    </div>
  );
}
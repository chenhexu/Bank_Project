"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("🔵 Google callback page loaded");
        console.log("🔵 Current URL:", window.location.href);
        console.log("🔵 Hash:", window.location.hash);
        console.log("🔵 Search:", window.location.search);
        
        // Get parameters from both fragment (#) and query (?)
        const hash = window.location.hash.substring(1);
        const search = window.location.search.substring(1);
        
        // Try both hash and search parameters
        let params = new URLSearchParams(hash);
        if (!params.has('access_token') && !params.has('id_token') && !params.has('error') && !params.has('code')) {
          params = new URLSearchParams(search);
        }
        
        const accessToken = params.get('access_token');
        const idToken = params.get('id_token');
        const code = params.get('code');
        const error = params.get('error');
        const state = params.get('state');

        console.log("🔵 Google callback received:");
        console.log("🔵 Access Token:", accessToken ? "Present" : "Missing");
        console.log("🔵 ID Token:", idToken ? "Present" : "Missing");
        console.log("🔵 Code:", code ? "Present" : "Missing");
        console.log("🔵 Error:", error);
        console.log("🔵 State:", state);

        if (error) {
          console.error("🔴 OAuth error:", error);
          // Redirect to login page with error
          router.push(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        // Handle authorization code flow (most common)
        if (code) {
          console.log("🔵 Processing authorization code...");
          
          try {
            // Send the authorization code to the backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                code: code,
                state: state
              }),
            });

            if (response.ok) {
              const result = await response.json();
              console.log("🔵 Backend response:", result);
              
              if (result.user_profile) {
                // Store user data and redirect to balance page
                sessionStorage.setItem("user", JSON.stringify(result.user_profile));
                localStorage.setItem("user", JSON.stringify(result.user_profile));
                router.push("/balance");
                return;
              }
            } else {
              const errorData = await response.json();
              console.error("🔴 Backend error:", errorData);
              router.push(`/login?error=${encodeURIComponent(errorData.detail || 'Authentication failed')}`);
              return;
            }
          } catch (fetchError) {
            console.error("🔴 Fetch error:", fetchError);
            router.push(`/login?error=${encodeURIComponent('Network error during authentication')}`);
            return;
          }
        }

        // Handle implicit flow (less common, for popup-based auth)
        if (idToken) {
          console.log("🔵 Processing ID token...");
          
          try {
            // Send the ID token to the backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                credential: idToken
              }),
            });

            if (response.ok) {
              const result = await response.json();
              console.log("🔵 Backend response:", result);
              
              if (result.user_profile) {
                // Store user data and redirect to balance page
                sessionStorage.setItem("user", JSON.stringify(result.user_profile));
                localStorage.setItem("user", JSON.stringify(result.user_profile));
                router.push("/balance");
                return;
              }
            } else {
              const errorData = await response.json();
              console.error("🔴 Backend error:", errorData);
              router.push(`/login?error=${encodeURIComponent(errorData.detail || 'Authentication failed')}`);
              return;
            }
          } catch (fetchError) {
            console.error("🔴 Fetch error:", fetchError);
            router.push(`/login?error=${encodeURIComponent('Network error during authentication')}`);
            return;
          }
        }

        // No valid token or code received
        console.error("🔴 No valid authentication data received");
        router.push(`/login?error=${encodeURIComponent('No authentication data received')}`);

      } catch (error) {
        console.error('🔴 Error in Google callback:', error);
        router.push(`/login?error=${encodeURIComponent('Callback processing failed')}`);
      }
    };

    // Run the callback handler with a small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      handleCallback();
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing Google authentication...</p>
      </div>
    </div>
  );
}
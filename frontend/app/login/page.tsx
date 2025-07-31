"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react"; // Added missing import for React.useEffect

// TypeScript declarations for Google Identity Services and Facebook SDK
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
    FB: {
      init: (config: any) => void;
      XFBML: {
        parse: (element: HTMLElement) => void;
      };
      login: (callback: (response: any) => void, options?: any) => void;
      api: (path: string, callback: (response: any) => void) => void;
    };
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const router = useRouter();

  // Google OAuth setup
  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: '730848972905-afaan25e1lhuj13ih9uir146o8b0lgch.apps.googleusercontent.com',
            callback: handleGoogleCredentialResponse
          });
          
          // Don't let Google SDK override our custom button
          // const buttonElement = document.getElementById('google-login-button');
          // if (buttonElement) {
          //   window.google.accounts.id.renderButton(
          //     buttonElement,
          //     { 
          //       theme: 'outline', 
          //       size: 'large', 
          //       width: '100%', 
          //       type: 'standard',
          //       text: 'signin_with',
          //       shape: 'rectangular'
          //     }
          //   );
          // }
        } catch (error) {
          console.error('Google OAuth initialization error:', error);
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load Google Identity Services');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Facebook OAuth setup
  useEffect(() => {
    // Load Facebook SDK
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.FB) {
        try {
          window.FB.init({
            appId: '1429308784784365', // Your Facebook App ID
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
          
          // Render Facebook Login button
          const buttonElement = document.getElementById('fb-login-button');
          if (buttonElement) {
            window.FB.XFBML.parse(buttonElement);
          }
        } catch (error) {
          console.error('Facebook OAuth initialization error:', error);
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load Facebook SDK');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleGoogleLogin = () => {
    setMessage("🔄 Google OAuth is temporarily disabled due to CORS issues. Please use Facebook login or email/password registration.");
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      setMessage("🔄 Authenticating with Google...");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/google-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: response.credential }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Google authentication failed");
      
      // Store user info in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem('email', data.user.email);
        sessionStorage.setItem('password', 'google_auth'); // Special password for Google users
        sessionStorage.setItem('displayName', data.user.display_name);
        sessionStorage.setItem('username', data.user.username);
      }
      
      setMessage("✅ Google login successful! Redirecting...");
      setTimeout(() => {
        router.push('/balance');
      }, 1000);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  const handleFacebookLogin = () => {
    // For development, show a message about Facebook login
    if (window.location.protocol === 'http:' && window.location.hostname === 'localhost') {
      setMessage("🔄 Facebook login requires HTTPS for security. For now, you can use Google login or regular login.");
      return;
    }
    
    if (window.FB) {
      window.FB.login((response: any) => {
        if (response.authResponse) {
          // User successfully logged in
          const accessToken = response.authResponse.accessToken;
          handleFacebookAuth(accessToken);
        } else {
          setMessage("❌ Facebook login cancelled");
        }
      }, { scope: 'email,public_profile' });
    } else {
      setMessage("❌ Facebook SDK not loaded. Please refresh the page.");
    }
  };

  const handleFacebookAuth = async (accessToken: string) => {
    try {
      setMessage("🔄 Authenticating with Facebook...");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/facebook-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Facebook authentication failed");
      
      // Store user info in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem('email', data.user.email);
        sessionStorage.setItem('password', 'facebook_auth'); // Special password for Facebook users
        sessionStorage.setItem('displayName', data.user.display_name);
        sessionStorage.setItem('username', data.user.username);
      }
      
      setMessage("✅ Facebook login successful! Redirecting...");
      setTimeout(() => {
        router.push('/balance');
      }, 1000);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      setMessage("✅ Login successful! Redirecting...");
      // Store credentials in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem('email', email);
        sessionStorage.setItem('password', password);
      }
      setTimeout(() => {
        router.push(`/balance`);
      }, 1000);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  const handleGenerateRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/generate-recovery-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate recovery code");
      
      // Recovery code sent successfully
      setMessage("✅ Recovery code sent to your email!");
      setShowResetForm(true);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: recoveryEmail, 
          recovery_code: recoveryCode, 
          new_password: newPassword 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to reset password");
      setMessage("✅ Password reset successfully! You can now login.");
      setShowRecovery(false);
      setShowResetForm(false);
      setRecoveryEmail("");
      setRecoveryCode("");
      setNewPassword("");
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  // Redirect to /balance if already logged in
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem('email');
      const storedPass = sessionStorage.getItem('password');
      if (storedEmail && storedPass) {
        router.push('/balance');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white/90 shadow-xl rounded-3xl px-10 py-12 max-w-md w-full flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="text-3xl font-extrabold text-blue-700 mb-2 tracking-tight">Login to BlueBank</div>
          <div className="text-sm text-blue-500 font-medium mb-2">Welcome back! Please enter your credentials.</div>
        </div>
        
        {/* Google Login Button */}
        <div className="w-full mb-6">
          <button
            id="google-login-button"
            onClick={handleGoogleLogin}
            className="w-full h-12 pl-3 pr-6 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-normal text-sm shadow transition flex items-center justify-start gap-3"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" style={{ marginTop: '1px' }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="flex-1 text-center">Log in with Google</span>
          </button>
        </div>
        
        {/* Facebook Login Button */}
        <div className="w-full mb-6">
          <button
            id="fb-login-button"
            onClick={handleFacebookLogin}
            className="w-full h-12 pl-3 pr-6 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-normal text-sm shadow transition flex items-center justify-start gap-3"
          >
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="flex-1 text-center">Log in with Facebook</span>
          </button>
        </div>
        
        <div className="w-full flex items-center mb-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
        
        <form className="flex flex-col gap-4 w-full mt-4" onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg text-gray-900 bg-white" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg text-gray-900 bg-white" />
          <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow transition mt-2">Log in</button>
        </form>
        {message && <div className="mt-4 text-center text-sm text-red-500">{message}</div>}
        <div className="mt-6 text-sm text-gray-500">
          Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Sign up</a>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <button 
            onClick={() => setShowRecovery(!showRecovery)} 
            className="text-blue-600 hover:underline"
          >
            Forgot your password?
          </button>
        </div>
      </div>
      
      {/* Password Recovery Form */}
      {showRecovery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-700">Password Recovery</h2>
              <button 
                onClick={() => {
                  setShowRecovery(false);
                  setShowResetForm(false);
                  setRecoveryEmail("");
                  setRecoveryCode("");
                  setNewPassword("");
                  setMessage("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {!showResetForm ? (
              <form onSubmit={handleGenerateRecoveryCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={recoveryEmail} 
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow transition"
                >
                  Send Recovery Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recovery Code</label>
                  <input 
                    type="text" 
                    value={recoveryCode} 
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg"
                    placeholder="Enter the recovery code"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-lg shadow transition"
                >
                  Reset Password
                </button>
              </form>
            )}
            
            {message && (
              <div className="mt-4 text-center text-sm text-red-500">{message}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

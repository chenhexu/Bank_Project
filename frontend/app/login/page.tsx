"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDarkMode } from "../../contexts/DarkModeContext";

export default function LoginPage() {
  const { isDarkMode } = useDarkMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Store credentials in sessionStorage for the balance page
        sessionStorage.setItem("email", email);
        sessionStorage.setItem("password", password);
        // Also store user data in localStorage for other components
        localStorage.setItem("user", JSON.stringify(data));
        setMessage("✅ Login successful! Redirecting...");
        setTimeout(() => router.push("/balance"), 1000);
      } else {
        const errorData = await res.json();
        setMessage(`❌ ${errorData.detail || "Login failed"}`);
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    setMessage(`⚠️ ${provider} OAuth is not configured yet. Please use email/password login.`);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-100 via-white to-blue-200'
    }`}>
      <div className={`max-w-2xl w-full space-y-8 ${
        isDarkMode 
          ? 'bg-gray-800/90 shadow-xl rounded-3xl px-12 py-16' 
          : 'bg-white/90 shadow-xl rounded-3xl px-12 py-16'
      }`}>
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>
            Sign in to your account
          </h2>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleOAuthLogin("Google")}
            className={`w-full flex justify-center items-center px-4 py-4 border border-blue-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-blue-50 transition-colors duration-200 ${
              isDarkMode 
                ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
            }`}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin("Facebook")}
            className={`w-full flex justify-center items-center px-4 py-4 border border-blue-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-blue-50 transition-colors duration-200 ${
              isDarkMode 
                ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Sign in with Facebook
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={`px-2 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
              Or continue with
            </span>
          </div>
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-2 block w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                    : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                }`}
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-2 block w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                    : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                }`}
              />
            </div>
          </div>

          {message && (
            <div className={`text-center p-3 rounded-md ${
              message.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-6 border border-blue-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode 
                ? 'border-blue-400 bg-blue-600 text-white hover:bg-blue-700' 
                : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-center">
            <Link href="/forgot-password" className={`text-sm hover:underline ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
              Forgot your password?
            </Link>
          </div>

          <div className="text-center">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account?{" "}
            </span>
            <Link href="/register" className={`text-sm font-medium hover:underline ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

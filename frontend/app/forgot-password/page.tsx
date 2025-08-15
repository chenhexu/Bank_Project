"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDarkMode } from "../../contexts/DarkModeContext";

export default function ForgotPasswordPage() {
  const { isDarkMode } = useDarkMode();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

            if (res.ok) {
        setMessage("✅ Recovery code sent to your email! Redirecting to reset password page...");
        // Auto-redirect to reset password page with email pre-filled
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        const errorData = await res.json();
        setMessage(`❌ ${errorData.detail || "Failed to send reset email"}`);
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
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
            Reset your password
          </h2>
          <p className={`mt-4 text-center text-base ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Enter your email address and we'll send you a recovery code to reset your password.
          </p>
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
            {isLoading ? "Sending..." : "Send reset link"}
          </button>

          <div className="text-center">
            <Link href="/login" className={`text-sm hover:underline ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 
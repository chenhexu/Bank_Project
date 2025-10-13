"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDarkMode } from "../../contexts/DarkModeContext";

export default function ResetPasswordPage() {
  const { isDarkMode } = useDarkMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill email from URL parameter
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("❌ Password must be at least 6 characters long");
      return;
    }
    
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          recovery_code: recoveryCode, 
          new_password: newPassword 
        }),
      });

      if (res.ok) {
        setMessage("✅ Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        const errorData = await res.json();
        setMessage(`❌ ${errorData.detail || "Failed to reset password"}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-blue-950 via-gray-900 to-blue-950'
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
            Enter your recovery code and new password to reset your account.
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
                readOnly={searchParams.get('email') !== null}
                className={`mt-2 block w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                    : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                } ${searchParams.get('email') !== null ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label htmlFor="recoveryCode" className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Recovery Code <span className="text-red-500">*</span>
              </label>
              <input
                id="recoveryCode"
                name="recoveryCode"
                type="text"
                required
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="Enter the 16-character code from your email"
                className={`mt-2 block w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                    : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                }`}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={`mt-2 block w-full px-4 py-4 border border-blue-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-blue-400 bg-gray-700 text-white hover:bg-blue-900/20' 
                    : 'border-blue-300 bg-white text-gray-900 hover:bg-blue-50'
                }`}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={`block text-base font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
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
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>

          <div className="text-center space-y-2">
            <Link href="/forgot-password" className={`text-sm hover:underline block ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
              Need a new recovery code?
            </Link>
            <Link href="/login" className={`text-sm hover:underline block ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import React from "react"; // Added missing import for React.useEffect

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
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
      const res = await fetch("http://127.0.0.1:8000/generate-recovery-code", {
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
      const res = await fetch("http://127.0.0.1:8000/reset-password", {
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
        <form className="flex flex-col gap-4 w-full mt-4" onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" />
          <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow transition mt-2">Login</button>
        </form>
        {message && <div className="mt-4 text-center text-sm text-red-500">{message}</div>}
        <div className="mt-6 text-sm text-gray-500">
          Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register</a>
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

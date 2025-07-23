"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => {
        router.push(`/balance?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
      }, 1000);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white/90 shadow-xl rounded-3xl px-10 py-12 max-w-md w-full flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="text-3xl font-extrabold text-blue-700 mb-2 tracking-tight">Login to BlueBank</div>
          <div className="text-sm text-blue-500 font-medium mb-2">Welcome back! Please enter your credentials.</div>
        </div>
        <form className="flex flex-col gap-4 w-full mt-4" onSubmit={handleLogin}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" />
          <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow transition mt-2">Login</button>
        </form>
        {message && <div className="mt-4 text-center text-sm text-red-500">{message}</div>}
        <div className="mt-6 text-sm text-gray-500">
          Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register</a>
        </div>
      </div>
    </div>
  );
}

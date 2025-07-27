"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import React from "react"; // Added missing import for React.useEffect
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './phone-input-custom.css';

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [phone, setPhone] = useState("");
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          display_name: displayName,
          username,
          password,
          phone,
          dob: `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`,
          email_updates: emailUpdates
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Register failed");
      // Auto-login after successful registration
      const loginRes = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.detail || "Login failed after registration");
      if (typeof window !== "undefined") {
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('password', password);
        sessionStorage.setItem('email', email);
        sessionStorage.setItem('displayName', displayName);
        sessionStorage.setItem('phone', phone);
        sessionStorage.setItem('dob', `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`);
      }
      setMessage("✅ Register and login successful! Redirecting to balance...");
      setTimeout(() => {
        router.push(`/balance`);
      }, 1000);
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  // Redirect to /balance if already logged in
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = sessionStorage.getItem('username');
      const storedPass = sessionStorage.getItem('password');
      if (storedUser && storedPass) {
        router.push('/balance');
      }
    }
  }, [router]);

  // Helper arrays for DOB dropdowns
  const months = ["Month", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const days = ["Day", ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))];
  const years = ["Year", ...Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col">
      <div className="w-full flex items-center px-16 py-8">
        <div className="text-4xl font-extrabold text-blue-700 tracking-tight">BlueBank</div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white/90 shadow-xl rounded-3xl px-16 py-16 max-w-2xl w-full flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
            <div className="text-3xl font-extrabold text-blue-700 mb-2 tracking-tight">Create an account</div>
        </div>
        <form className="flex flex-col gap-4 w-full mt-4" onSubmit={handleRegister}>
            <label className="text-xs font-bold text-gray-700">EMAIL <span className="text-red-500">*</span></label>
            <input type="email" placeholder="" value={email} onChange={e => setEmail(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" required />

            <label className="text-xs font-bold text-gray-700">DISPLAY NAME</label>
            <input type="text" placeholder="" value={displayName} onChange={e => setDisplayName(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" />

            <label className="text-xs font-bold text-gray-700">USERNAME <span className="text-red-500">*</span></label>
            <input type="text" placeholder="" value={username} onChange={e => setUsername(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" required />

            <label className="text-xs font-bold text-gray-700">PASSWORD <span className="text-red-500">*</span></label>
            <input type="password" placeholder="" value={password} onChange={e => setPassword(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" required />

            <label className="text-xs font-bold text-gray-700">DATE OF BIRTH <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <select value={dobMonth} onChange={e => setDobMonth(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" required>
                {months.map((m, i) => <option key={i} value={i === 0 ? "" : m} disabled={i === 0}>{m}</option>)}
              </select>
              <select value={dobDay} onChange={e => setDobDay(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" required>
                {days.map((d, i) => <option key={i} value={i === 0 ? "" : d} disabled={i === 0}>{d}</option>)}
              </select>
              <select value={dobYear} onChange={e => setDobYear(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" required>
                {years.map((y, i) => <option key={i} value={i === 0 ? "" : y} disabled={i === 0}>{y}</option>)}
              </select>
            </div>

            <PhoneInput
              country={'us'}
              value={phone}
              onChange={setPhone}
              inputProps={{
                name: 'phone',
                required: false,
                autoFocus: false,
                placeholder: 'Phone number'
              }}
            />

            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="emailUpdates" checked={emailUpdates} onChange={e => setEmailUpdates(e.target.checked)} />
              <label htmlFor="emailUpdates" className="text-xs text-gray-600">(Optional) It’s okay to send me emails with BlueBank updates, tips, and special offers. You can opt out at any time.</label>
            </div>

            <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow transition mt-2">Create Account</button>
        </form>
        {message && <div className="mt-4 text-center text-sm text-red-500">{message}</div>}
        <div className="mt-6 text-sm text-gray-500">
            Already have an account? <a href="/login" className="text-blue-600 hover:underline">Log in</a>
          </div>
        </div>
      </div>
    </div>
  );
}

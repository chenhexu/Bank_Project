"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function DepositPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem('email') || '';
      const storedPass = sessionStorage.getItem('password') || '';
      setEmail(storedEmail);
      setPassword(storedPass);
      if (!storedEmail || !storedPass) {
        router.push('/login');
      }
    }
  }, [router]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, amount: parseFloat(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Deposit failed");
      setMessage(`✅ ${data.message}. New balance: $${data.new_balance}`);
      setTimeout(() => {
        router.push(`/balance`);
      }, 1000);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white/90 shadow-xl rounded-3xl px-10 py-12 max-w-md w-full flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="text-3xl font-extrabold text-blue-700 mb-2 tracking-tight">Deposit Funds</div>
          <div className="text-sm text-blue-500 font-medium mb-2">Add money to your BlueBank account.</div>
        </div>
        <form className="flex flex-col gap-4 w-full mt-4" onSubmit={handleDeposit}>
          <input type="number" step="0.01" min="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg" />
          <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow transition mt-2">Deposit</button>
        </form>
        {message && <div className="mt-4 text-center text-sm text-blue-500">{message}</div>}
        <div className="mt-6 text-sm text-gray-500 flex gap-4">
          <a href="/balance" className="text-blue-600 hover:underline">Back to Balance</a>
          <a href="/withdraw" className="text-blue-600 hover:underline">Withdraw</a>
        </div>
      </div>
    </div>
  );
}

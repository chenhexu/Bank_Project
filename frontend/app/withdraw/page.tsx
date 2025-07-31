"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";

export default function WithdrawPage() {
  const { isDarkMode } = useDarkMode();
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

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, amount: parseFloat(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Withdraw failed");
      setMessage(`✅ ${data.message}. New balance: $${data.new_balance}`);
      setTimeout(() => {
        router.push(`/balance`);
      }, 1000);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${isDarkMode ? 'from-gray-900 via-gray-800 to-gray-900' : 'from-blue-100 via-white to-blue-200'}`}>
      <div className={`${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} shadow-xl rounded-3xl px-10 py-12 max-w-md w-full flex flex-col items-center`}>
        <div className="mb-8 flex flex-col items-center">
          <div className={`text-3xl font-extrabold mb-2 tracking-tight ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Withdraw Funds</div>
          <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`}>Take money out of your BlueBank account.</div>
        </div>
        <form className="flex flex-col gap-4 w-full mt-4" onSubmit={handleWithdraw}>
          <input 
            type="number" 
            step="0.01" 
            min="0.01" 
            placeholder="Amount" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            className={`px-4 py-3 rounded-xl border focus:ring-2 outline-none text-lg no-spinner ${isDarkMode ? 'border-gray-600 focus:border-blue-400 focus:ring-blue-900 text-white bg-gray-700' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-100 text-gray-900 bg-white'}`} 
          />
          <button type="submit" className={`w-full py-3 rounded-xl font-semibold text-lg shadow transition mt-2 text-white ${isDarkMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}>Withdraw</button>
        </form>
        {message && <div className={`mt-4 text-center text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`}>{message}</div>}
        <div className={`mt-6 text-sm flex gap-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <a href="/balance" className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Back to Balance</a>
          <a href="/deposit" className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Deposit</a>
        </div>
      </div>
    </div>
  );
}

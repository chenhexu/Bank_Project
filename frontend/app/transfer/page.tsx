"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";

export default function TransferPage() {
  const { isDarkMode } = useDarkMode();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    
    if (!recipientEmail.trim()) {
      setMessage("❌ Please enter recipient's email address");
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setMessage("❌ Please enter a valid amount");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          from_email: email, 
          password, 
          to_email: recipientEmail, 
          amount: parseFloat(amount) 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Transfer failed");
      setMessage(`✅ ${data.message}. New balance: $${data.new_balance}`);
      setTimeout(() => {
        router.push(`/balance`);
      }, 2000);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${isDarkMode ? 'from-gray-900 via-gray-800 to-gray-900' : 'from-blue-100 via-white to-blue-200'}`}>
      <div className={`${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} shadow-xl rounded-3xl px-10 py-12 max-w-md w-full flex flex-col items-center`}>
        <div className="mb-8 flex flex-col items-center">
          <div className={`text-3xl font-extrabold mb-2 tracking-tight ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Transfer Money</div>
          <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`}>Send money to another BlueBank user.</div>
        </div>
        <form className="flex flex-col gap-4 w-full mt-4" onSubmit={handleTransfer}>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recipient Email</label>
            <input 
              type="email" 
              placeholder="Enter recipient's email" 
              value={recipientEmail} 
              onChange={e => setRecipientEmail(e.target.value)} 
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none text-lg ${isDarkMode ? 'border-gray-600 focus:border-blue-400 focus:ring-blue-900 text-white bg-gray-700' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-100 text-gray-900 bg-white'}`} 
              required 
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amount</label>
            <input 
              type="number" 
              placeholder="Enter amount" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none text-lg no-spinner ${isDarkMode ? 'border-gray-600 focus:border-blue-400 focus:ring-blue-900 text-white bg-gray-700' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-100 text-gray-900 bg-white'}`} 
              min="0.01" 
              step="0.01" 
              required 
            />
          </div>
          <button 
            type="submit" 
            className={`w-full py-3 rounded-xl font-semibold text-lg shadow transition mt-2 text-white ${isDarkMode ? 'bg-green-500 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'}`}
          >
            Transfer Money
          </button>
        </form>
        {message && <div className={`mt-4 text-center text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`}>{message}</div>}
        <div className={`mt-6 text-sm flex gap-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <a href="/balance" className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Back to Balance</a>
          <a href="/deposit" className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Deposit</a>
          <a href="/withdraw" className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Withdraw</a>
        </div>
      </div>
    </div>
  );
} 
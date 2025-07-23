"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CounterScroller from "../../components/CounterScroller";

type Transaction = {
  type: string;
  amount: string;
  old_balance: string;
  new_balance: string;
  timestamp: string;
};

export default function BalancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";
  const password = searchParams.get("password") || "";

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const prevBalanceRef = useRef<number>(0);

  useEffect(() => {
    async function fetchBalance() {
      try {
        setLoading(true);
        const res = await fetch(
          `http://127.0.0.1:8000/balance/${username}?password=${encodeURIComponent(password)}`
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Failed to fetch balance");
        }
        const data = await res.json();
        prevBalanceRef.current = balance;
        setBalance(parseFloat(data.balance));
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (username && password) {
      fetchBalance();
    }
  }, [username, password]);

  useEffect(() => {
    async function fetchTransactions() {
      if (!showHistory) return;
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/transactions/${username}?password=${encodeURIComponent(password)}`
        );
        if (!res.ok) {
          const data = await res.json();
          console.log("Fetched balance data:", data);
          throw new Error(data.detail || "Failed to fetch transactions");
        }
        const data: Transaction[] = await res.json();
        setTransactions(data);
      } catch (err: any) {
        setError(err.message);
      }
    }
    if (username && password) {
      fetchTransactions();
    }
  }, [showHistory, username, password]);

  const handleLogout = () => {
    router.push("/login");
  };
  const goDeposit = () => {
    router.push(`/deposit?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
  };
  const goWithdraw = () => {
    router.push(`/withdraw?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
  };

  // Determine animation start value
  let animationFrom = prevBalanceRef.current;
  if (typeof window !== "undefined" && !sessionStorage.getItem("visitedBalance")) {
    animationFrom = 0;
    sessionStorage.setItem("visitedBalance", "true");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white/90 shadow-xl rounded-3xl px-8 py-10 max-w-2xl w-full flex flex-col items-center">
        <header className="flex justify-between items-center w-full mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Account Balance</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow"
          >
            Logout
          </button>
        </header>
        {loading ? (
          <p className="text-center text-lg text-blue-500">Loading balance...</p>
        ) : error ? (
          <p className="text-center text-red-600 font-semibold">{error}</p>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="flex justify-center items-end mb-6 gap-1 text-6xl font-extrabold text-blue-600">
              <CounterScroller from={animationFrom} to={balance} duration={1000} minDigits={6} />
            </div>
            <div className="flex justify-center gap-4 mb-6 w-full">
              <button
                onClick={goDeposit}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-semibold shadow transition w-40"
              >
                Deposit
              </button>
              <button
                onClick={goWithdraw}
                className="px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl text-lg font-semibold shadow transition w-40 border border-blue-300"
              >
                Withdraw
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowHistory((prev) => !prev)}
          className="mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl w-max mx-auto transition-colors mt-2"
          aria-expanded={showHistory}
          aria-controls="transaction-history"
        >
          {showHistory ? "Hide Transaction History" : "Show Transaction History"}
        </button>
        <div
          id="transaction-history"
          className={`overflow-hidden transition-all duration-500 ease-in-out max-w-2xl mx-auto w-full ${showHistory ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          {transactions.length === 0 ? (
            <p className="text-center text-blue-400">No transactions found.</p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto border rounded-xl p-3 bg-blue-50">
              {transactions.map((tx, idx) => {
                const number = transactions.length - idx;
                const amountColor =
                  tx.type.toLowerCase() === "deposit"
                    ? "text-green-600"
                    : tx.type.toLowerCase() === "withdraw"
                    ? "text-red-600"
                    : "";
                return (
                  <li
                    key={idx}
                    className="p-2 border-b last:border-b-0 flex justify-between items-center"
                  >
                    <div>
                      <p>
                        <span className="font-bold mr-3">{number}.</span>
                        <strong>{tx.type}</strong>{" "}
                        <span className={amountColor}>${tx.amount}</span>
                      </p>
                      <p className="text-sm text-gray-600">{tx.timestamp}</p>
                    </div>
                    <div className="text-sm text-gray-800">
                      <p>
                        {tx.old_balance} → {tx.new_balance}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

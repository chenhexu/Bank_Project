"use client";

import { useSearchParams } from "next/navigation";

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";
  const password = searchParams.get("password") || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white/90 shadow-xl rounded-3xl px-10 py-12 max-w-2xl w-full flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="text-3xl font-extrabold text-blue-700 mb-2 tracking-tight">Transaction History</div>
          <div className="text-sm text-blue-500 font-medium mb-2">See all your recent transactions.</div>
        </div>
        {/* Transaction list would go here */}
        <div className="w-full bg-blue-50 rounded-xl p-4 text-center text-blue-400">No transactions to display.</div>
        <div className="mt-6 text-sm text-gray-500">
          <a href={`/balance?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`} className="text-blue-600 hover:underline">Back to Balance</a>
        </div>
      </div>
    </div>
  );
}

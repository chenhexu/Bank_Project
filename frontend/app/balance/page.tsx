"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import CounterScroller from "../../components/CounterScroller";
import { useDarkMode } from "../../contexts/DarkModeContext";

type Transaction = {
  type: string;
  amount: string;
  old_balance: string;
  new_balance: string;
  timestamp: string;
  description: string;
};

export default function BalancePage() {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // On mount, get credentials from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem('email') || '';
      const storedPass = sessionStorage.getItem('password') || '';
      setEmail(storedEmail);
      setPassword(storedPass);
      
      console.log("Balance page - Retrieved from sessionStorage:", {
        email: storedEmail,
        password: storedPass
      });
      
      if (!storedEmail || !storedPass) {
        console.log("No credentials found, redirecting to login");
        router.push('/login');
      }
      
      // Dark mode is now handled by the context
    }
  }, [router]);

  const [balance, setBalance] = useState<number>(0);
  const [animationFrom, setAnimationFrom] = useState<number>(0);
  const [initialized, setInitialized] = useState(false);
  const [firstVisit, setFirstVisit] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const prevBalanceRef = useRef<number>(0);
  const [showArrow, setShowArrow] = useState(false);
  const [arrowDirection, setArrowDirection] = useState<'up' | 'down' | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Get current user's email for user-specific balance storage
      const currentUserEmail = sessionStorage.getItem('email');
      const balanceKey = currentUserEmail ? `lastBalance_${currentUserEmail}` : 'lastBalance';
      
      const lastBalance = sessionStorage.getItem(balanceKey);
      const initial = lastBalance !== null ? parseFloat(lastBalance) : 0;
      setAnimationFrom(initial);
      setBalance(initial);
      setInitialized(true);
    }
  }, []);

  // Fetch user profile data
  useEffect(() => {
    async function fetchProfile() {
      if (!email || !password) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.display_name || email.split('@')[0]);
        }
      } catch (err) {
        console.log("Profile fetch error:", err);
      }
    }
    fetchProfile();
  }, [email, password]);

  useEffect(() => {
    if (!initialized) return;
    async function fetchBalance() {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Failed to fetch balance");
        }
        const data = await res.json();
        const newBalance = parseFloat(data.balance);

        if (typeof window !== "undefined") {
          // Get current user's email for user-specific balance storage
          const currentUserEmail = sessionStorage.getItem('email');
          const balanceKey = currentUserEmail ? `lastBalance_${currentUserEmail}` : 'lastBalance';
          sessionStorage.setItem(balanceKey, newBalance.toString());
        }

        setTimeout(() => {
          setAnimationFrom(balance);
          setBalance(newBalance);
        }, 400);
      } catch (err: any) {
        console.log("Balance fetch error:", err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    if (email && password) {
      fetchBalance();
    }
    // eslint-disable-next-line
  }, [email, password, initialized]);

  // Check for new transfer notifications
  useEffect(() => {
    if (!email || !password) return;
    
    async function checkForNewTransfers() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
          const data = await res.json();
          const recentTransfers = data.filter((tx: Transaction) => 
            (tx.type === "Transfer In" || tx.type === "Transfer Out") &&
            new Date(tx.timestamp) > new Date(Date.now() - 60000) // Last minute
          );
          
          recentTransfers.forEach((tx: Transaction) => {
            const notification = tx.type === "Transfer In" 
              ? `💰 Received $${tx.amount} from ${tx.description || 'an unknown user'}`
              : `💸 Sent $${tx.amount} to ${tx.description || 'an unknown user'}`;
            
            if (!notifications.includes(notification)) {
              setNotifications(prev => [...prev, notification]);
            }
          });
        }
      } catch (err) {
        console.log("Transfer notification check error:", err);
      }
    }
    
    // Check every 30 seconds for new transfers
    const interval = setInterval(checkForNewTransfers, 30000);
    return () => clearInterval(interval);
  }, [email, password, notifications]);

  useEffect(() => {
    async function fetchTransactions() {
      if (!showHistory) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Failed to fetch transactions");
        }
        const data: Transaction[] = await res.json();
        setTransactions(data);
      } catch (err: any) {
        console.log("Transactions fetch error:", err);
        setError(err.message || String(err));
      }
    }
    if (email && password) {
      fetchTransactions();
    }
  }, [showHistory, email, password]);

  // Debug CounterScroller props
  useEffect(() => {
    console.log("CounterScroller props:", { animationFrom, balance, type: typeof animationFrom, balanceType: typeof balance });
  }, [animationFrom, balance]);

  // Animation arrow logic
  useEffect(() => {
    if (animationFrom === balance) {
      setShowArrow(false);
      setArrowDirection(null);
      return;
    }
    if (animationFrom < balance) {
      setArrowDirection('up');
      setShowArrow(true);
    } else if (animationFrom > balance) {
      setArrowDirection('down');
      setShowArrow(true);
    } else {
      setShowArrow(false);
      setArrowDirection(null);
    }
    // Fade out after animation duration
    const timer = setTimeout(() => {
      setShowArrow(false);
    }, 1000); // match CounterScroller duration
    return () => clearTimeout(timer);
  }, [animationFrom, balance]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    // Clear credentials and redirect
    if (typeof window !== "undefined") {
      sessionStorage.removeItem('email');
      sessionStorage.removeItem('password');
    }
    router.push("/login");
  };
  const goDeposit = () => {
    router.push(`/deposit`);
  };
  const goWithdraw = () => {
    router.push(`/withdraw`);
  };

  const goTransfer = () => {
    router.push(`/transfer`);
  };

  // Remove old animationFrom logic and use the state
  // let animationFrom = prevBalanceRef.current;
  // if (typeof window !== "undefined" && !sessionStorage.getItem("visitedBalance")) {
  //   animationFrom = 0;
  //   sessionStorage.setItem("visitedBalance", "true");
  // }

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-100 via-white to-blue-200'
    }`}>
      <div className={`shadow-xl rounded-3xl px-12 py-14 max-w-4xl w-full flex flex-col items-center transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'
      }`}>
        <header className="flex justify-between items-center w-full mb-8 relative">
          <h1 className={`text-4xl font-bold ${
            isDarkMode ? 'text-blue-400' : 'text-blue-700'
          }`}>Account Balance</h1>
          {/* Username dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((open) => !open)}
              className={`px-6 py-3 rounded-xl font-semibold shadow transition flex items-center gap-2 min-w-[120px] text-lg ${
                isDarkMode 
                  ? 'bg-blue-900/50 hover:bg-blue-800/50 text-blue-300' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
            >
              <span className="truncate max-w-[100px]">{displayName || email.split('@')[0]}</span>
              <svg className={`w-5 h-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {dropdownOpen && (
              <div className={`absolute right-0 mt-2 w-48 border rounded-xl shadow-lg z-50 animate-fadein flex flex-col overflow-visible ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-blue-200'
              }`}>
                <a
                  href="/profile"
                  className={`px-6 py-4 font-medium rounded-t-xl transition text-left text-lg ${
                    isDarkMode 
                      ? 'hover:bg-gray-600 text-gray-200' 
                      : 'hover:bg-blue-50 text-blue-700'
                  }`}
                  onClick={() => setDropdownOpen(false)}
                >
                  Profile
                </a>
          <button
            onClick={handleLogout}
                  className={`px-6 py-4 font-semibold rounded-b-xl transition text-left text-lg ${
                    isDarkMode 
                      ? 'hover:bg-red-900/50 text-red-400' 
                      : 'hover:bg-red-50 text-red-600'
                  }`}
          >
                  Log out
          </button>
              </div>
            )}
          </div>
        </header>
        {loading ? (
          <p className={`text-center text-xl ${
            isDarkMode ? 'text-blue-400' : 'text-blue-500'
          }`}>Loading balance...</p>
        ) : error ? (
          <p className="text-center text-red-600 font-semibold text-lg">{typeof error === 'object' ? JSON.stringify(error) : error}</p>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className={`flex justify-center items-end mb-8 gap-1 text-7xl font-extrabold relative ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <CounterScroller from={isNaN(animationFrom) ? 0 : animationFrom} to={isNaN(balance) ? 0 : balance} duration={1000} minDigits={6} />
              {/* Arrow animation */}
              <style jsx>{`
                .balance-arrow {
                  transition: opacity 0.5s, transform 0.5s;
                  opacity: 0;
                  transform: scale(1.2);
                  pointer-events: none;
                }
                .balance-arrow.visible {
                  opacity: 1;
                  transform: scale(1.5);
                }
              `}</style>
              {arrowDirection && (
                <span
                  className={`balance-arrow absolute right-[-3rem] bottom-2 flex items-center ${showArrow ? 'visible' : ''}`}
                  aria-label={arrowDirection === 'up' ? 'Balance increased' : 'Balance decreased'}
                >
                  {arrowDirection === 'up' ? (
                    <svg width="40" height="40" viewBox="0 0 32 32">
                      <polygon points="16,6 26,22 6,22" fill="#22c55e" />
                    </svg>
                  ) : (
                    <svg width="40" height="40" viewBox="0 0 32 32">
                      <polygon points="16,26 26,10 6,10" fill="#ef4444" />
                    </svg>
                  )}
                </span>
              )}
            </div>
            <div className="flex justify-center gap-6 mb-8 w-full">
              <button
                onClick={goDeposit}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xl font-semibold shadow transition w-48"
              >
                Deposit
              </button>
              <button
                onClick={goWithdraw}
                className={`px-8 py-4 rounded-xl text-xl font-semibold shadow transition w-48 border ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300'
                }`}
              >
                Withdraw
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowHistory((prev) => !prev)}
          className="mb-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl w-max mx-auto transition-colors mt-4 text-lg font-semibold"
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
            <p className={`text-center text-lg ${
              isDarkMode ? 'text-blue-300' : 'text-blue-400'
            }`}>No transactions found.</p>
          ) : (
            <ul className={`space-y-3 max-h-96 overflow-y-auto border rounded-xl p-4 ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
            }`}>
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
                    className={`p-4 border-b last:border-b-0 flex justify-between items-center ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <p className={`text-lg ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        <span className="font-bold mr-3">{number}.</span>
                        <strong>{tx.type}</strong>{" "}
                        <span className={amountColor}>${tx.amount}</span>
                        {tx.description && (
                          <span className={`text-sm ml-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            ({tx.description})
                          </span>
                        )}
                      </p>
                      <p className={`text-base ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{tx.timestamp}</p>
                    </div>
                    <div className={`text-base ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-800'
                    }`}>
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
        <button
          onClick={goTransfer}
          className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl w-max mx-auto transition-colors text-lg font-semibold"
        >
          Transfer Money
        </button>
        
        {/* Notification Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-4 rounded-full shadow-lg transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          
          {/* Notification Panel */}
          {showNotifications && (
            <div className={`absolute bottom-16 right-0 w-80 max-h-96 overflow-y-auto rounded-xl shadow-xl border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-blue-200'
            }`}>
              <div className={`p-4 border-b ${
                isDarkMode ? 'border-gray-600' : 'border-blue-200'
              }`}>
                <h3 className={`font-semibold text-lg ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Notifications ({notifications.length})
                </h3>
              </div>
              <div className="p-2">
                {notifications.length === 0 ? (
                  <p className={`text-center py-4 text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No new notifications
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                        }`}
                      >
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {notification}
                        </p>
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className={`p-3 border-t ${
                  isDarkMode ? 'border-gray-600' : 'border-blue-200'
                }`}>
                  <button
                    onClick={() => setNotifications([])}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                    }`}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

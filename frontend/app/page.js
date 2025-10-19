"use client";

import { useDarkMode } from "../contexts/DarkModeContext";

export default function HomePage() {
  const { isDarkMode } = useDarkMode();
  
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isDarkMode 
        ? 'bg-gradient-to-br from-blue-950 via-gray-900 to-blue-950' // Dark blue gradient for dark mode
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'  // Light blue gradient for light mode
    }`}>
      <div className={`shadow-xl rounded-3xl px-10 py-12 max-w-md w-full flex flex-col items-center transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'
      }`}>
        <div className="mb-8 flex flex-col items-center">
          <div className={`text-5xl font-extrabold mb-2 tracking-tight ${
            isDarkMode ? 'text-blue-400' : 'text-blue-700'
          }`}>BlueBank</div>
          <div className={`text-lg font-medium mb-2 ${
            isDarkMode ? 'text-blue-300' : 'text-blue-500'
          }`}>Your modern digital banking experience</div>
          <div className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-400'
          }`}>Safe. Simple. Secure.</div>
        </div>
        <div className="flex flex-col gap-4 w-full mt-4">
          <a href="/login" className={`w-full text-center py-3 rounded-xl font-semibold text-lg shadow transition ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>Login</a>
          <a href="/register" className={`w-full text-center py-3 rounded-xl font-semibold text-lg shadow transition ${
            isDarkMode 
              ? 'bg-gray-700 border border-blue-500 hover:bg-gray-600 text-blue-300' 
              : 'bg-white border border-blue-600 hover:bg-blue-50 text-blue-700'
          }`}>Register</a>
        </div>
        <div className={`mt-10 text-xs text-center ${
          isDarkMode ? 'text-gray-300' : 'text-gray-400'
        }`}>
          &copy; {new Date().getFullYear()} BlueBank. All rights reserved.
        </div>
      </div>
    </div>
  );
}

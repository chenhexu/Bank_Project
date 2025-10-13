"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  resetDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load dark mode preference from sessionStorage, fallback to system preference
    if (typeof window !== "undefined") {
      const storedDarkMode = sessionStorage.getItem('darkMode');
      let shouldUseDarkMode = false;
      
      if (storedDarkMode !== null) {
        // User has explicitly set a preference
        shouldUseDarkMode = storedDarkMode === 'true';
      } else {
        // Use system preference as default
        shouldUseDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setIsDarkMode(shouldUseDarkMode);
      
      // Apply dark mode to document immediately
      if (shouldUseDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      setIsLoaded(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Save to sessionStorage
    sessionStorage.setItem('darkMode', newDarkMode.toString());
    
    // Apply dark mode to the document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const resetDarkMode = () => {
    // Clear the stored preference and use system preference
    sessionStorage.removeItem('darkMode');
    
    // Get system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemPrefersDark);
    
    // Apply system preference to document
    if (systemPrefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Don't render until we've loaded the initial state
  if (!isLoaded) {
    return null;
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode, resetDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
} 
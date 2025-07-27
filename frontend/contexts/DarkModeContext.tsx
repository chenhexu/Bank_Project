"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load dark mode preference from sessionStorage
    if (typeof window !== "undefined") {
      const storedDarkMode = sessionStorage.getItem('darkMode') === 'true';
      setIsDarkMode(storedDarkMode);
      
      // Apply dark mode to document immediately
      if (storedDarkMode) {
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

  // Don't render until we've loaded the initial state
  if (!isLoaded) {
    return null;
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
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
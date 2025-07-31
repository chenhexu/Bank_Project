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
    // Function to load dark mode preference
    const loadDarkModePreference = () => {
      if (typeof window !== "undefined") {
        // Get current user's email for user-specific storage
        const currentUserEmail = sessionStorage.getItem('email');
        const darkModeKey = currentUserEmail ? `darkMode_${currentUserEmail}` : 'darkMode';
        
        const storedDarkMode = sessionStorage.getItem(darkModeKey);
        let isDarkMode = false;
        
        if (storedDarkMode !== null) {
          // Use stored preference if available
          isDarkMode = storedDarkMode === 'true';
        } else {
          // Use system preference if no stored preference
          isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        setIsDarkMode(isDarkMode);
        
        // Apply dark mode to document immediately
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    // Load initial preference
    loadDarkModePreference();
    
    // Listen for storage changes (when user logs in/out)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'email') {
        loadDarkModePreference();
      }
    };
    
    // Listen for system dark mode changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const currentUserEmail = sessionStorage.getItem('email');
      const darkModeKey = currentUserEmail ? `darkMode_${currentUserEmail}` : 'darkMode';
      
      if (sessionStorage.getItem(darkModeKey) === null) {
        // Only auto-update if user hasn't manually set a preference
        setIsDarkMode(e.matches);
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    mediaQuery.addEventListener('change', handleSystemChange);
    setIsLoaded(true);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Get current user's email for user-specific storage
    const currentUserEmail = sessionStorage.getItem('email');
    const darkModeKey = currentUserEmail ? `darkMode_${currentUserEmail}` : 'darkMode';
    
    // Save to sessionStorage with user-specific key
    sessionStorage.setItem(darkModeKey, newDarkMode.toString());
    
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
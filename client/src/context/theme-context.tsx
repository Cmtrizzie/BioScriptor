
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  actualTheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  const getActualTheme = (currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  };

  const applyTheme = (newTheme: Theme) => {
    const actualTheme = getActualTheme(newTheme);
    
    // Remove existing theme classes
    document.documentElement.classList.remove('light', 'dark');
    document.body.classList.remove('light', 'dark');
    
    // Add new theme class
    document.documentElement.classList.add(actualTheme);
    document.body.classList.add(actualTheme);
    
    // Set data attribute for CSS variables
    document.documentElement.setAttribute('data-theme', actualTheme);
    
    // Store in localStorage
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    const themeOrder: Theme[] = ['system', 'light', 'dark'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const actualTheme = getActualTheme(theme);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      isDark: actualTheme === 'dark',
      actualTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

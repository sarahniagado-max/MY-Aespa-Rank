import { useState, useCallback, useEffect } from 'react';

const THEME_KEY = 'aespa_theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || 'aurora'; } catch { return 'aurora'; }
  });

  useEffect(() => {
    document.body.classList.toggle('theme-minimal', theme === 'minimal');
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'aurora' ? 'minimal' : 'aurora';
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle, isMinimal: theme === 'minimal' };
}

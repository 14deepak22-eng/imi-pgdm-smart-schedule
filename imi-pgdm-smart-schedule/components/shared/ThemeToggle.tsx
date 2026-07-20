'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Theme = 'dark' | 'light';

function readStoredTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

export function ThemeToggle() {
  // Starts null so the button doesn't render a possibly-wrong icon before
  // hydration reads the class the inline init script already applied.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    queueMicrotask(() => setTheme(readStoredTheme()));
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage may be unavailable (private browsing); theme just won't persist.
    }
  };

  return (
    <Button
      variant="ghost"
      className="h-9 w-9 p-0"
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}

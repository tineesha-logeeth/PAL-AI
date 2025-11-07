import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

type Theme = 'light' | 'dark';

const ThemeIcon = ({ theme, isActive }: { theme: Theme; isActive: boolean }) => {
  const baseClasses = "w-5 h-5 transition-colors";
  const activeClasses = "text-[var(--accent-color-1)]";
  const inactiveClasses = "text-[var(--text-secondary)]";

  const className = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;

  switch (theme) {
    case 'light':
      return <Sun className={className} />;
    case 'dark':
      return <Moon className={className} />;
    default:
      return null;
  }
};

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: Theme[] = ['light', 'dark'];

  return (
    <div className="flex items-center p-1 rounded-full bg-[var(--bg-input)] border border-[var(--border-secondary)]">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`p-1.5 rounded-full transition-colors ${
            theme === t ? 'bg-[var(--bg-active-nav)] shadow-sm' : 'hover:bg-[var(--bg-hover)]'
          }`}
          aria-label={`Switch to ${t} theme`}
        >
          <ThemeIcon theme={t} isActive={theme === t} />
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
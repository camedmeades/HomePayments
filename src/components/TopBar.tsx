import { useLocation } from 'react-router-dom';
import { Database } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendar',
  '/bills': 'Bills',
  '/trends': 'Trends',
  '/insights': 'Insights',
  '/suppliers': 'Suppliers',
  '/entities': 'Entities',
  '/categories': 'Categories',
  '/settings': 'Settings',
};

export function TopBar() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? '';

  return (
    <header className="h-14 shrink-0 border-b border-border bg-panel flex items-center justify-between px-6">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3 text-xs text-ink-dim">
        <Database size={14} />
        <span>Local · unsynced</span>
      </div>
    </header>
  );
}

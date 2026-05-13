import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  TrendingUp,
  Lightbulb,
  Store,
  Layers,
  Tags,
  Settings as SettingsIcon,
} from 'lucide-react';

const NAV: Array<{ to: string; label: string; Icon: typeof LayoutDashboard }> = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/bills', label: 'Bills', Icon: Receipt },
  { to: '/trends', label: 'Trends', Icon: TrendingUp },
  { to: '/insights', label: 'Insights', Icon: Lightbulb },
  { to: '/suppliers', label: 'Suppliers', Icon: Store },
  { to: '/entities', label: 'Entities', Icon: Layers },
  { to: '/categories', label: 'Categories', Icon: Tags },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-panel flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <div className="font-semibold tracking-tight text-base">Billcal</div>
        <div className="text-xs text-ink-dim mt-0.5">Household finance</div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? 'nav-item nav-item-active' : 'nav-item'
            }
          >
            <Icon size={16} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-border text-xs text-ink-dim">
        v0.1.0 · local-first
      </div>
    </aside>
  );
}

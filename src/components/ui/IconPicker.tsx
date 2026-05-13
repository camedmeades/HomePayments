/**
 * Icon picker. We expose a curated subset of lucide-react icons rather
 * than all 1500+. The selection is biased toward icons useful for
 * categorising household bills, entities and suppliers.
 */

import {
  Home,
  Building,
  Briefcase,
  TrendingUp,
  Layers,
  Tag,
  Receipt,
  Banknote,
  CreditCard,
  Calculator,
  ShoppingCart,
  ShoppingBag,
  Store,
  Zap,
  Flame,
  Droplet,
  Wifi,
  Smartphone,
  Phone,
  Tv,
  Cloud,
  Car,
  Bike,
  Plane,
  Bus,
  Fuel,
  Wrench,
  Hammer,
  PaintBucket,
  Key,
  ShieldCheck,
  HeartPulse,
  Stethoscope,
  Pill,
  GraduationCap,
  BookOpen,
  Library,
  Music,
  Film,
  Gamepad2,
  Dumbbell,
  Coffee,
  UtensilsCrossed,
  Pizza,
  Dog,
  Cat,
  Trees,
  Sun,
  Leaf,
  Sparkles,
  Gift,
  PartyPopper,
  Globe,
  Landmark,
  Scale,
  FileText,
  Folder,
  Star,
  Heart,
  Bell,
  Repeat,
  Package,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Home,
  Building,
  Briefcase,
  TrendingUp,
  Layers,
  Tag,
  Receipt,
  Banknote,
  CreditCard,
  Calculator,
  ShoppingCart,
  ShoppingBag,
  Store,
  Zap,
  Flame,
  Droplet,
  Wifi,
  Smartphone,
  Phone,
  Tv,
  Cloud,
  Car,
  Bike,
  Plane,
  Bus,
  Fuel,
  Wrench,
  Hammer,
  PaintBucket,
  Key,
  ShieldCheck,
  HeartPulse,
  Stethoscope,
  Pill,
  GraduationCap,
  BookOpen,
  Library,
  Music,
  Film,
  Gamepad2,
  Dumbbell,
  Coffee,
  UtensilsCrossed,
  Pizza,
  Dog,
  Cat,
  Trees,
  Sun,
  Leaf,
  Sparkles,
  Gift,
  PartyPopper,
  Globe,
  Landmark,
  Scale,
  FileText,
  Folder,
  Star,
  Heart,
  Bell,
  Repeat,
  Package,
};

/**
 * Render an icon by name. Falls back to Tag if the name is unknown.
 */
export function IconByName({
  name,
  size = 16,
  className,
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = ICONS[name] ?? Tag;
  return <Icon size={size} className={className} style={style} strokeWidth={1.75} />;
}

interface PickerProps {
  value: string;
  onChange: (name: string) => void;
}

export function IconPicker({ value, onChange }: PickerProps) {
  return (
    <div className="grid grid-cols-10 gap-1 max-h-44 overflow-y-auto p-1 border border-border rounded-md bg-bg">
      {Object.entries(ICONS).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          title={name}
          aria-label={`Use icon ${name}`}
          onClick={() => onChange(name)}
          className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
            value === name
              ? 'bg-info text-white'
              : 'hover:bg-panel text-ink-dim hover:text-ink'
          }`}
        >
          <Icon size={16} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

export const ICON_NAMES = Object.keys(ICONS);

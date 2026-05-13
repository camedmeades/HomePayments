/**
 * A curated swatch picker. We deliberately do NOT expose a full colour
 * picker — the goal is to keep the app's palette coherent, and these
 * options were chosen for adequate contrast against both light and dark
 * backgrounds.
 */

const SWATCHES = [
  '#2563eb', // blue
  '#0ea5e9', // sky
  '#06b6d4', // cyan
  '#0d9488', // teal
  '#16a34a', // green
  '#65a30d', // lime
  '#eab308', // yellow
  '#f59e0b', // amber
  '#f97316', // orange
  '#dc2626', // red
  '#e11d48', // rose
  '#be185d', // pink
  '#a855f7', // purple
  '#7c3aed', // violet
  '#6366f1', // indigo
  '#737373', // grey
  '#525252', // slate
  '#1f2937', // ink
];

interface Props {
  value: string;
  onChange: (hex: string) => void;
}

export function ColourPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SWATCHES.map((hex) => (
        <button
          key={hex}
          type="button"
          aria-label={`Use colour ${hex}`}
          onClick={() => onChange(hex)}
          className={`w-6 h-6 rounded-full ring-offset-2 ring-offset-panel transition-all ${
            value.toLowerCase() === hex.toLowerCase()
              ? 'ring-2 ring-ink scale-110'
              : 'hover:scale-110'
          }`}
          style={{ background: hex }}
        />
      ))}
    </div>
  );
}

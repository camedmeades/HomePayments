import { forwardRef } from 'react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

type ButtonVariant = 'default' | 'primary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

const buttonClasses: Record<ButtonVariant, string> = {
  default: 'bg-panel border-border text-ink hover:bg-bg',
  primary: 'bg-info border-info text-white hover:bg-blue-700',
  danger: 'bg-bad border-bad text-white hover:bg-red-700',
  ghost: 'bg-transparent border-transparent text-ink-dim hover:bg-bg hover:text-ink',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center gap-2 font-medium rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className = '', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`w-full px-3 py-2 text-sm border rounded-md bg-panel focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info transition-colors ${invalid ? 'border-bad' : 'border-border'} ${className}`}
      {...rest}
    />
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className = '', ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`w-full px-3 py-2 text-sm border rounded-md bg-panel focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info transition-colors ${invalid ? 'border-bad' : 'border-border'} ${className}`}
      {...rest}
    />
  );
});

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className = '', ...rest }: LabelProps) {
  return (
    <label
      className={`block text-xs font-medium text-ink-dim uppercase tracking-wider mb-1.5 ${className}`}
      {...rest}
    />
  );
}

export function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <p className="text-xs text-bad mt-1">{message}</p>;
}

interface NativeSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
  { invalid, className = '', children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`w-full px-3 py-2 text-sm border rounded-md bg-panel focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info transition-colors ${invalid ? 'border-bad' : 'border-border'} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
});

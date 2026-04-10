'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'outline'
  | 'outlineAccent';
type Size = 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'bg-bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed',
  secondary:
    'bg-bg-light text-text-dark hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed',
  danger: 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed',
  ghost: 'text-text-muted hover:bg-bg-light disabled:opacity-40 disabled:cursor-not-allowed',
  outline:
    'border border-bg-dark text-text-dark hover:bg-bg-light disabled:opacity-40 disabled:cursor-not-allowed',
  outlineAccent:
    'bg-white border border-bg-accent text-text-accent hover:bg-bg-blue disabled:opacity-40 disabled:cursor-not-allowed',
};

const SIZE_CLASS: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`
        rounded-[10px] font-semibold transition-all cursor-pointer
        ${VARIANT_CLASS[variant]}
        ${SIZE_CLASS[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

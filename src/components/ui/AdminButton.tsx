interface AdminButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  type?: 'button' | 'submit';
}

const VARIANTS = {
  primary: 'text-white bg-slate-700 hover:bg-slate-800',
  secondary: 'text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white',
  danger: 'text-red-500 hover:text-white border border-red-200 hover:border-red-500 bg-white hover:bg-red-500',
} as const;

const SIZES = {
  sm: 'text-xs px-3 py-2',
  md: 'text-sm px-4 py-1.5',
} as const;

export function AdminButton({
  children,
  onClick,
  disabled = false,
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
}: AdminButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  );
}

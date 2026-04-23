const positionStyles = {
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
};

const variantConfig = {
  default: {
    iconColor: 'text-slate-400',
    icon: (
      <>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 6.5a1.5 1.5 0 1 1 1.5 1.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
      </>
    ),
    bgClass: 'bg-bg-accent',
  },
  danger: {
    iconColor: 'text-text-danger',
    icon: (
      <>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
      </>
    ),
    bgClass: 'bg-text-danger',
  },
};

export function Tooltip({
  text,
  position = 'right',
  variant = 'default',
}: {
  text: string;
  position?: 'right' | 'bottom' | 'left' | 'top';
  variant?: 'default' | 'danger';
}) {
  const config = variantConfig[variant];

  // named group (`group/tooltip`) 으로 상위 `.group` 과 격리 — 외부 카드가 `group` 클래스를
  // 가져도 상위 hover 가 이 툴팁을 트리거하지 못하게 한다.
  return (
    <span className="relative group/tooltip" onClick={(e) => e.stopPropagation()}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        className={`${config.iconColor} cursor-help`}
      >
        {config.icon}
      </svg>
      <span
        className={`absolute ${positionStyles['bottom']} lg:hidden px-3 py-2 text-xs text-white ${config.bgClass} rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 w-max max-w-[200px]`}
      >
        {text}
      </span>
      <span
        className={`absolute ${positionStyles[position]} hidden lg:block px-3 py-2 text-xs text-white ${config.bgClass} rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 whitespace-pre-line w-max max-w-xs`}
      >
        {text}
      </span>
    </span>
  );
}

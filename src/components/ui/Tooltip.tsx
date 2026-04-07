const positionStyles = {
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
};

export function Tooltip({
  text,
  position = 'right',
}: {
  text: string;
  position?: 'right' | 'bottom' | 'left' | 'top';
}) {
  return (
    <span className="relative group" onClick={(e) => e.stopPropagation()}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        className="text-slate-400 cursor-help"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6.5 6.5a1.5 1.5 0 1 1 1.5 1.5v1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
      </svg>
      <span
        className={`absolute ${positionStyles[position]} px-3 py-2 text-xs text-white bg-bg-accent rounded-lg shadow-lg border border-slate-100 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-pre-line w-max max-w-xs`}
      >
        {text}
      </span>
    </span>
  );
}

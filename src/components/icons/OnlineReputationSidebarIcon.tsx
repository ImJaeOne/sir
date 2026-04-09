export function OnlineReputationSidebarIcon({ size = 20, color = '#828EA6' }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 20 18" fill="none">
      <path
        d="M1.5 18C1.1 18 0.75 17.85 0.45 17.55C0.15 17.25 0 16.9 0 16.5V1.5C0 1.1 0.15 0.75 0.45 0.45C0.75 0.15 1.1 0 1.5 0H18.5C18.9 0 19.25 0.15 19.55 0.45C19.85 0.75 20 1.1 20 1.5V16.5C20 16.9 19.85 17.25 19.55 17.55C19.25 17.85 18.9 18 18.5 18H1.5ZM4.225 13.85H15.775V12.35H4.225V13.85ZM4.225 9.7H8.1V4.15H4.225V9.7ZM10.7 9.7H15.775V8.2H10.7V9.7ZM10.7 5.65H15.775V4.15H10.7V5.65Z"
        fill={color}
      />
    </svg>
  );
}

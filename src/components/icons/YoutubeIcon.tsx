export function YoutubeIcon({ size = 30, color = '#66B6FF' }: { size?: number; color?: string }) {
  const height = Math.round((size / 34) * 22);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={height} viewBox="0 0 34 22" fill="none">
      <path
        d="M26 0C30.4183 0 34 3.58172 34 8V14C34 18.4183 30.4183 22 26 22H8C3.58172 22 1.28855e-07 18.4183 0 14V8C1.28855e-07 3.58172 3.58172 1.61064e-08 8 0H26ZM14.5 15.3301L22 11L14.5 6.66992V15.3301Z"
        fill={color}
      />
    </svg>
  );
}

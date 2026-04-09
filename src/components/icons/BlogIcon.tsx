export function BlogIcon({ size = 30, color = '#9747FF' }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 30 30" fill="none">
      <path
        d="M3.75 21.25V8.75H16.25V21.25H3.75ZM3.75 6.25V3.75H26.25V6.25H3.75ZM18.75 11.25V8.75H26.25V11.25H18.75ZM18.75 16.25V13.75H26.25V16.25H18.75ZM18.75 21.25V18.75H26.25V21.25H18.75ZM3.75 26.25V23.75H26.25V26.25H3.75Z"
        fill={color}
      />
    </svg>
  );
}

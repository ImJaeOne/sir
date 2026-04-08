export function TopContentsIcon({ size = 70 }: { size?: number }) {
  const height = Math.round((size / 70) * 68);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={height} viewBox="0 0 70 68" fill="none">
      <g filter="url(#filter0_d_88_2469)">
        <path d="M34.8762 59.7135L63.1763 43.1135C64.5763 42.3135 64.5763 40.5135 63.1763 39.6135L40.4762 25.1135C39.6763 24.6135 38.7762 24.5135 37.9762 25.1135L6.17625 41.8135C4.67625 42.6135 4.57625 44.6135 6.07625 45.5135L29.5763 59.7135C31.1763 60.7135 33.1762 60.7135 34.8762 59.7135Z" fill="url(#paint0_linear_88_2469)" />
      </g>
      <path d="M34.8762 47.3132L63.1763 30.7132C64.5763 29.9132 64.5763 28.1132 63.1763 27.2132L40.4762 12.7132C39.6763 12.2132 38.7762 12.1132 37.9762 12.7132L6.17625 29.4132C4.67625 30.2132 4.57625 32.2132 6.07625 33.1132L29.5763 47.3132C31.1763 48.3132 33.1762 48.3132 34.8762 47.3132Z" fill="#CCF9FF" />
      <path d="M35.2766 35.0134L63.5766 18.4133C64.9766 17.6133 64.9766 15.8133 63.5766 14.9133L40.8766 0.413349C40.0766 -0.0866512 39.1766 -0.186651 38.3766 0.413349L6.57664 17.1133C5.07664 17.9133 4.97664 19.9133 6.47664 20.8133L29.9766 35.0134C31.5766 36.0134 33.5766 36.0134 35.2766 35.0134Z" fill="url(#paint2_linear_88_2469)" />
      <g filter="url(#filter1_d_88_2469)">
        <path d="M20.2758 19.6134L17.6758 17.8134L27.5758 12.7134L30.2758 14.4134L20.2758 19.6134Z" fill="white" />
        <path d="M24.9754 22.5134L22.2754 20.8134L35.2754 14.2134L37.8754 15.9134L24.9754 22.5134Z" fill="white" />
        <path d="M29.5756 25.6134L26.9756 23.9134L36.9756 18.7134L39.5756 20.4134L29.5756 25.6134Z" fill="white" />
        <path d="M34.2758 28.5136L31.6758 26.8136L38.1758 23.4136L40.7758 25.1136L34.2758 28.5136Z" fill="white" />
      </g>
      <defs>
        <filter id="filter0_d_88_2469" x="0" y="21.7002" width="69.2266" height="45.7632" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="2.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.266667 0 0 0 0 0.505882 0 0 0 0 0.992157 0 0 0 0.5 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_88_2469" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_88_2469" result="shape" />
        </filter>
        <filter id="filter1_d_88_2469" x="7.67578" y="5.71338" width="43.0996" height="35.8003" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.266667 0 0 0 0 0.505882 0 0 0 0 0.992157 0 0 0 0.5 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_88_2469" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_88_2469" result="shape" />
        </filter>
        <linearGradient id="paint0_linear_88_2469" x1="34.6762" y1="34.7135" x2="34.6762" y2="72.4135" gradientUnits="userSpaceOnUse">
          <stop offset="0.2" stopColor="#5AA5FF" />
          <stop offset="0.3" stopColor="#5AA4FF" />
          <stop offset="0.6" stopColor="#4481FD" />
        </linearGradient>
        <linearGradient id="paint2_linear_88_2469" x1="51.0766" y1="-10.4867" x2="27.3766" y2="31.3133" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C6FFFF" />
          <stop offset="1" stopColor="#9FD2FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function WeeklyHighlightIcon({ size = 80, className }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
      <g clipPath="url(#clip0_88_1197)">
        <g filter="url(#filter0_d_88_1197)">
          <path
            d="M47.1 12.6H16.5C10.9772 12.6 6.5 17.0772 6.5 22.6V44.3C6.5 49.8229 10.9772 54.3 16.5 54.3H47.1C52.6228 54.3 57.1 49.8229 57.1 44.3V22.6C57.1 17.0772 52.6228 12.6 47.1 12.6Z"
            fill="url(#paint0_linear_88_1197)"
          />
        </g>
        <path
          d="M61.7998 21.7H25.9998C19.5381 21.7 14.2998 26.9383 14.2998 33.4V58.8C14.2998 65.2617 19.5381 70.5 25.9998 70.5H61.7998C68.2615 70.5 73.4998 65.2617 73.4998 58.8V33.4C73.4998 26.9383 68.2615 21.7 61.7998 21.7Z"
          fill="url(#paint1_linear_88_1197)"
        />
        <g filter="url(#filter1_d_88_1197)">
          <path
            d="M65.1004 45.1L68.2004 33.4L56.5004 36.5L58.9004 38.9L50.5004 47.2L44.3004 41L35.3004 50L30.2004 45L22.4004 52.8L26.3004 56.8L30.2004 52.8L35.3004 57.9L44.3004 48.8L50.5004 55L62.8004 42.8L65.1004 45.1Z"
            fill="white"
          />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_d_88_1197"
          x="1.5"
          y="9.60001"
          width="60.5996"
          height="51.7"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="2.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.266667 0 0 0 0 0.505882 0 0 0 0 0.992157 0 0 0 0.5 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_88_1197" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_88_1197" result="shape" />
        </filter>
        <filter
          id="filter1_d_88_1197"
          x="12.4004"
          y="26.4"
          width="65.7998"
          height="44.5"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="5" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.266667 0 0 0 0 0.505882 0 0 0 0 0.992157 0 0 0 0.5 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_88_1197" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_88_1197" result="shape" />
        </filter>
        <linearGradient
          id="paint0_linear_88_1197"
          x1="31.7"
          y1="3.80001"
          x2="31.7"
          y2="47.9"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#66B6FF" />
          <stop offset="0.2" stopColor="#5AA5FF" />
          <stop offset="0.3" stopColor="#5AA4FF" />
          <stop offset="0.6" stopColor="#4481FD" />
          <stop offset="1" stopColor="#2653FC" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_88_1197"
          x1="43.8998"
          y1="9.10001"
          x2="43.8998"
          y2="55.9"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#C6FFFF" />
          <stop offset="1" stopColor="#9FD2FF" />
        </linearGradient>
        <clipPath id="clip0_88_1197">
          <rect width="80" height="80" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

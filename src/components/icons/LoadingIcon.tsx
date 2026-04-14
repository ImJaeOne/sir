interface LoadingIconProps {
  width?: number;
  height?: number;
}

export function LoadingIcon({ width = 93, height = 81 }: LoadingIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 93 81" fill="none">
      <path
        d="M30.5 13.25H6.25C2.79822 13.25 0 16.0482 0 19.5V44.875C0 48.3268 2.79822 51.125 6.25 51.125H30.5C33.9518 51.125 36.75 48.3268 36.75 44.875V19.5C36.75 16.0482 33.9518 13.25 30.5 13.25Z"
        fill="url(#paint0_linear_177_6774)"
      />
      <path
        d="M54.25 34.625H22.25C18.7982 34.625 16 37.4232 16 40.875V74.25C16 77.7018 18.7982 80.5 22.25 80.5H54.25C57.7018 80.5 60.5 77.7018 60.5 74.25V40.875C60.5 37.4232 57.7018 34.625 54.25 34.625Z"
        fill="url(#paint1_linear_177_6774)"
      />
      <g filter="url(#filter0_d_177_6774)">
        <path
          d="M62 57.25C71.665 57.25 79.5 49.1911 79.5 39.25C79.5 29.3089 71.665 21.25 62 21.25C52.335 21.25 44.5 29.3089 44.5 39.25C44.5 49.1911 52.335 57.25 62 57.25Z"
          fill="white"
        />
      </g>
      <path
        d="M51.375 14C55.241 14 58.375 10.866 58.375 7C58.375 3.13401 55.241 0 51.375 0C47.509 0 44.375 3.13401 44.375 7C44.375 10.866 47.509 14 51.375 14Z"
        fill="url(#paint2_linear_177_6774)"
      />
      <path
        d="M88.5 32.5C90.9853 32.5 93 30.4853 93 28C93 25.5147 90.9853 23.5 88.5 23.5C86.0147 23.5 84 25.5147 84 28C84 30.4853 86.0147 32.5 88.5 32.5Z"
        fill="url(#paint3_linear_177_6774)"
      />
      <path
        d="M89.875 60.375L78 48.5C79.625 45.75 80.375 42.5 80.375 39.375C80.375 34.75 78.5 30.125 75 26.625C71.5 23.125 66.875 21.25 62.25 21.25C57.625 21.25 53 23.125 49.5 26.625C46 30.125 44.125 34.75 44.125 39.375C44.125 44 46 48.625 49.5 52.125C53 55.625 57.625 57.5 62.25 57.5C65.375 57.5 68.375 56.75 71.125 55.125L83 67C83.875 67.875 85.25 68.25 86.375 68.25C87.5 68.25 88.75 67.875 89.75 66.75C91.625 64.875 91.625 61.875 89.75 60.125H89.875V60.375ZM62.25 48.125C60 48.125 57.75 47.375 56.125 45.5C54.5 43.875 53.5 41.625 53.5 39.375C53.5 37.125 54.375 34.875 56.125 33.25C57.75 31.625 60 30.625 62.25 30.625C64.5 30.625 66.75 31.375 68.375 33.25C70 34.875 71 37.125 71 39.375C71 41.625 70.25 43.875 68.375 45.5C66.75 47.125 64.5 48.125 62.25 48.125Z"
        fill="url(#paint4_linear_177_6774)"
      />
      <defs>
        <filter
          id="filter0_d_177_6774"
          x="34.5"
          y="14.25"
          width="55"
          height="56"
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
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.266667 0 0 0 0 0.505882 0 0 0 0 0.992157 0 0 0 0.5 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_177_6774" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_177_6774" result="shape" />
        </filter>
        <linearGradient id="paint0_linear_177_6774" x1="18.375" y1="5.375" x2="18.375" y2="45.375" gradientUnits="userSpaceOnUse">
          <stop stopColor="#66B6FF" />
          <stop offset="0.2" stopColor="#5AA5FF" />
          <stop offset="0.3" stopColor="#5AA4FF" />
          <stop offset="0.6" stopColor="#4481FD" />
          <stop offset="1" stopColor="#2653FC" />
        </linearGradient>
        <linearGradient id="paint1_linear_177_6774" x1="38.25" y1="25.125" x2="38.25" y2="73.625" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C6FFFF" />
          <stop offset="1" stopColor="#9FD2FF" />
        </linearGradient>
        <linearGradient id="paint2_linear_177_6774" x1="51.375" y1="0.125" x2="51.375" y2="17.125" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D8EEFF" />
          <stop offset="0.3" stopColor="#AFDFFF" />
          <stop offset="1" stopColor="#56C0FF" />
        </linearGradient>
        <linearGradient id="paint3_linear_177_6774" x1="88.5" y1="23.5" x2="88.5" y2="34.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#66B6FF" />
          <stop offset="0.2" stopColor="#5AA5FF" />
          <stop offset="0.3" stopColor="#5AA4FF" />
          <stop offset="0.6" stopColor="#4481FD" />
          <stop offset="1" stopColor="#2653FC" />
        </linearGradient>
        <linearGradient id="paint4_linear_177_6774" x1="66.25" y1="28.125" x2="68.25" y2="64.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#66B6FF" />
          <stop offset="0.2" stopColor="#5AA5FF" />
          <stop offset="0.3" stopColor="#5AA4FF" />
          <stop offset="0.6" stopColor="#4481FD" />
          <stop offset="1" stopColor="#2653FC" />
        </linearGradient>
      </defs>
    </svg>
  );
}

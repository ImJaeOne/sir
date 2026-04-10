interface ServiceIconProps {
  width?: number;
  height?: number;
}

export function ServiceIcon({ width = 89, height = 57 }: ServiceIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 89 57" fill="none">
      <path
        d="M79.625 20.5C79.625 26.125 75 30.75 69.375 30.75C63.75 30.75 59.125 26.125 59.125 20.5C59.125 14.875 63.75 10.25 69.375 10.25C75 10.25 79.625 14.875 79.625 20.5Z"
        fill="url(#paint0_linear_88_3157)"
      />
      <path
        d="M84.25 41.625C80.875 37.25 75.5 34.375 69.5 34.375C59.125 34.375 50.75 42.75 50.75 53.125V56.125H88.25V53.125C88.25 48.75 86.75 44.75 84.25 41.625Z"
        fill="url(#paint1_linear_88_3157)"
      />
      <path
        d="M54 20.5C54 26.125 49.375 30.75 43.75 30.75C38.125 30.75 33.5 26.125 33.5 20.5C33.5 14.875 38.125 10.25 43.75 10.25C49.375 10.25 54 14.875 54 20.5Z"
        fill="url(#paint2_linear_88_3157)"
      />
      <path
        d="M58.625 41.625C55.25 37.25 49.875 34.375 43.875 34.375C33.5 34.375 25.125 42.75 25.125 53.125V56.125H62.625V53.125C62.625 48.75 61.125 44.75 58.625 41.625Z"
        fill="url(#paint3_linear_88_3157)"
      />
      <path
        d="M15 0.125C23.25 0.125 30 6.875 30 15.125C30 23.375 29 21.25 27.25 23.75L29.25 31.125L20.875 28.875C19.125 29.625 17.125 30 15 30C6.75 30 0 23.25 0 15C0 6.75 6.75 0 15 0V0.125Z"
        fill="url(#paint4_linear_88_3157)"
      />
      <path
        d="M7.875 17.625C9.39378 17.625 10.625 16.3938 10.625 14.875C10.625 13.3562 9.39378 12.125 7.875 12.125C6.35622 12.125 5.125 13.3562 5.125 14.875C5.125 16.3938 6.35622 17.625 7.875 17.625Z"
        fill="white"
      />
      <path
        d="M15 17.625C16.5188 17.625 17.75 16.3938 17.75 14.875C17.75 13.3562 16.5188 12.125 15 12.125C13.4812 12.125 12.25 13.3562 12.25 14.875C12.25 16.3938 13.4812 17.625 15 17.625Z"
        fill="white"
      />
      <path
        d="M22 17.625C23.5188 17.625 24.75 16.3938 24.75 14.875C24.75 13.3562 23.5188 12.125 22 12.125C20.4812 12.125 19.25 13.3562 19.25 14.875C19.25 16.3938 20.4812 17.625 22 17.625Z"
        fill="white"
      />
      <defs>
        <linearGradient id="paint0_linear_88_3157" x1="69.5" y1="11.625" x2="69.5" y2="55.375" gradientUnits="userSpaceOnUse">
          <stop stopColor="#66B6FF" />
          <stop offset="0.2" stopColor="#5AA4FF" />
          <stop offset="0.4" stopColor="#5AA5FF" />
          <stop offset="0.7" stopColor="#4481FD" />
          <stop offset="1" stopColor="#2653FC" />
        </linearGradient>
        <linearGradient id="paint1_linear_88_3157" x1="69.5" y1="10.5" x2="69.5" y2="54.125" gradientUnits="userSpaceOnUse">
          <stop stopColor="#66B6FF" />
          <stop offset="0.2" stopColor="#5AA4FF" />
          <stop offset="0.4" stopColor="#5AA5FF" />
          <stop offset="0.7" stopColor="#4481FD" />
          <stop offset="1" stopColor="#2653FC" />
        </linearGradient>
        <linearGradient id="paint2_linear_88_3157" x1="44.125" y1="3.87427" x2="44.125" y2="38.8743" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C6FFFF" />
          <stop offset="0.2" stopColor="#B9F0FF" />
          <stop offset="0.7" stopColor="#A6DAFF" />
          <stop offset="1" stopColor="#9FD2FF" />
        </linearGradient>
        <linearGradient id="paint3_linear_88_3157" x1="43.75" y1="15.375" x2="43.75" y2="51.125" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C6FFFF" />
          <stop offset="0.2" stopColor="#B9F0FF" />
          <stop offset="0.7" stopColor="#A6DAFF" />
          <stop offset="1" stopColor="#9FD2FF" />
        </linearGradient>
        <linearGradient id="paint4_linear_88_3157" x1="15" y1="3" x2="15" y2="33.875" gradientUnits="userSpaceOnUse">
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

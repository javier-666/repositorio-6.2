import React from 'react';

const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 424 180" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0.5" x2="1" y2="0.5">
        <stop offset="0%" stopColor="#0F2B48" />
        <stop offset="100%" stopColor="#14B8A6" />
      </linearGradient>
      <filter id="logo-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.2" />
      </filter>
    </defs>
    <g transform="translate(0, 10)">
      {/* Infinity Symbol with Shadow */}
      <g filter="url(#logo-shadow)">
        <path
          d="M162.1,86.3c14.6-24.3,47.8-27.1,66.8-9.2c21,19.8,22.2,52.3,2.4,73.3c-14.6,15.5-39.1,19.3-56.9,9.2 C151.7,146.4,129,118.8,129,86.3c0-32.5,22.7-59.9,46.1-46.8c18.6,10.4,43.3,6.8,57.1-9.2c19.8-22.2,18.7-54.7-2.4-73.3 c-17-15.3-43-18.2-61.9-9.1C89.3,13.6,67,41.2,67,73.7C67,106.2,89.3,133.8,117.9,149.5z"
          transform="scale(0.8) translate(80, -15)"
          fill="url(#logo-gradient)"
        />
      </g>
      {/* Code symbol </> */}
      <text
        x="235"
        y="80"
        fontFamily="monospace, 'Courier New'"
        fontSize="24"
        fontWeight="bold"
        fill="#A7F3D0" /* Lighter teal for better contrast */
        textAnchor="middle"
        dominantBaseline="middle"
      >
        &lt;/&gt;
      </text>
      {/* Vibration lines - Left */}
      <path d="M98,60 C94,65,94,75,98,80" stroke="#0F2B48" strokeWidth="4" fill="none" opacity="0.9" transform="translate(8, -5)"/>
      <path d="M92,55 C86,65,86,75,92,85" stroke="#0F2B48" strokeWidth="2.5" fill="none" opacity="0.7" transform="translate(8, -5)"/>

      {/* Vibration lines - Right */}
      <path d="M300,60 C304,65,304,75,300,80" stroke="#14B8A6" strokeWidth="4" fill="none" opacity="0.9" transform="translate(2, -5)" />
      <path d="M306,55 C312,65,312,75,306,85" stroke="#14B8A6" strokeWidth="2.5" fill="none" opacity="0.7" transform="translate(2, -5)" />
    </g>
    <text
      x="212"
      y="155"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      fontSize="36"
      fontWeight="600"
      letterSpacing="2"
      textAnchor="middle"
      fill="currentColor"
    >
      INFINITUM
      <tspan fill="#14B8A6" fontWeight="500"> Dev</tspan>
    </text>
  </svg>
);

export default Logo;

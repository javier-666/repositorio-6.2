import React from 'react';

const FireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.69 11.69A8.34 8.34 0 0 0 12 3a8.34 8.34 0 0 0-8.69 8.69c0 4.53 3.5 9.22 8.69 11.31 5.19-2.09 8.69-6.78 8.69-11.31z"/>
    <path d="M12 4c-2.2 2.2-2.2 6.8 0 9"/>
  </svg>
);

export default FireIcon;

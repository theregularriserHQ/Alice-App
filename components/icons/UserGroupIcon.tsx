
import React from 'react';

const UserGroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 18.72a9.094 9.094 0 00-9 0m9 0a9.094 9.094 0 01-9 0m9 0v.343A9.094 9.094 0 0112 21.75c-2.676 0-5.12-1.06-6.874-2.825M12 12.75a4.125 4.125 0 100-8.25 4.125 4.125 0 000 8.25zM12 12.75c-2.278 0-4.125-.788-4.125-1.75s1.847-1.75 4.125-1.75 4.125.788 4.125 1.75-1.847 1.75-4.125 1.75z"
    />
  </svg>
);

export default UserGroupIcon;

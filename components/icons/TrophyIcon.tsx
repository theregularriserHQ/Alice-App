
import React from 'react';

const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 0 1 9 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 18.375c.621 0 1.125-.504 1.125-1.125V6.108c0-.621-.504-1.125-1.125-1.125a4.5 4.5 0 0 0-4.5-4.5h-3.75a4.5 4.5 0 0 0-4.5 4.5c-.621 0-1.125.504-1.125 1.125v11.142c0 .621.504 1.125 1.125 1.125h1.5a.375.375 0 0 1 .375.375V21a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75v-2.25a.375.375 0 0 1 .375-.375h1.5Z" />
  </svg>
);

export default TrophyIcon;

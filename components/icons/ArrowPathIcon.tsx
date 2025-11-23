
import React from 'react';

const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-6.219-8.56" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
    </svg>
);

export default ArrowPathIcon;

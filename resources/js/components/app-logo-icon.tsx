import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
            <path
                d="M12 2L3 6.5V12c0 5.25 3.75 9.5 9 10 5.25-.5 9-4.75 9-10V6.5L12 2z"
                fill="currentColor"
                fillOpacity="0.15"
            />
            <path
                d="M12 2L3 6.5V12c0 5.25 3.75 9.5 9 10 5.25-.5 9-4.75 9-10V6.5L12 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path d="M9 12.5l2 2 4-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

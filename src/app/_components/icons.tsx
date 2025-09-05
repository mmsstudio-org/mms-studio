import type { SVGProps } from "react";

export const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    {...props}
    className="h-6 w-6 text-accent"
  >
    <path
      fill="currentColor"
      d="M148 40v33.37L128 92.19l-20-18.82V40h40m16-16h-72v48l28 26.36L88 144H40v72h72v-48l-28-26.36L168 96h48V24h-72Z"
    />
  </svg>
);

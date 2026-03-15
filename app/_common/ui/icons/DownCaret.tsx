"use client";

interface DownCaretProps {
  className?: string;
  stroke?: string;
  strokeWidth?: number;
}

const DownCaret: React.FC<DownCaretProps> = ({ className = "h-3 w-3", stroke = "currentColor", strokeWidth = 2 }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={stroke}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M19 9l-7 7-7-7" />
    </svg>
  );
};

export default DownCaret;
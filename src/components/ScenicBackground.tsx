import React from 'react';

interface ScenicBackgroundProps {
  theme: 'light' | 'dark';
  fixed?: boolean;
  className?: string;
}

export const ScenicBackground: React.FC<ScenicBackgroundProps> = ({
  theme,
  fixed = true,
  className = '',
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      aria-hidden="true"
      className={`${
        fixed ? 'fixed' : 'absolute'
      } inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-150 ${
        isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'
      } ${className}`}
    />
  );
};

export default ScenicBackground;


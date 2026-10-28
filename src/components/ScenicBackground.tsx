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
      } inset-0 pointer-events-none z-0 overflow-hidden select-none ${className}`}
    >
      {/* Background Cosmic Vortex Image */}
      <img
        src="/background.jpg"
        alt=""
        className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ${
          isDark
            ? 'opacity-75 scale-100 filter brightness-95 contrast-105'
            : 'opacity-20 scale-100 filter brightness-110 contrast-90'
        }`}
      />

      {/* Atmospheric Base Color & Vignette for Content Readability */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark
            ? 'bg-gradient-to-b from-[#070b14]/75 via-[#0b101e]/35 to-[#070b14]/85'
            : 'bg-gradient-to-b from-[#e0f2fe]/80 via-[#f8fafc]/75 to-[#fed7aa]/50'
        }`}
      />

      {/* Subtle Glowing Cyan/Teal Radial Aura to complement the vortex center */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700 ${
          isDark
            ? 'bg-gradient-to-tr from-teal-500/15 via-cyan-500/20 to-indigo-500/15'
            : 'bg-gradient-to-tr from-teal-300/25 via-sky-200/25 to-amber-200/20'
        }`}
      />
    </div>
  );
};

export default ScenicBackground;


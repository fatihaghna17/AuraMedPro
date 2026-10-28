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
      {/* Background Cosmic Vortex Image (Dark Mode) */}
      <img
        src="/background-dark.jpg"
        alt=""
        className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ${
          isDark
            ? 'opacity-75 scale-100 filter brightness-95 contrast-105'
            : 'opacity-0 scale-105 pointer-events-none'
        }`}
      />

      {/* Background Celestial Vortex Image (Light Mode) */}
      <img
        src="/background-light.jpg"
        alt=""
        className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ${
          !isDark
            ? 'opacity-85 scale-100 filter brightness-100 contrast-95'
            : 'opacity-0 scale-105 pointer-events-none'
        }`}
      />

      {/* Atmospheric Base Color & Vignette for Content Readability */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark
            ? 'bg-gradient-to-b from-[#070b14]/75 via-[#0b101e]/35 to-[#070b14]/85'
            : 'bg-gradient-to-b from-[#e6e9ef]/80 via-[#eff1f5]/55 to-[#e6e9ef]/85'
        }`}
      />

      {/* Subtle Glowing Radial Aura to complement the vortex center */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700 ${
          isDark
            ? 'bg-gradient-to-tr from-teal-500/15 via-cyan-500/20 to-indigo-500/15'
            : 'bg-gradient-to-tr from-sky-400/20 via-teal-300/25 to-indigo-300/15'
        }`}
      />
    </div>
  );
};

export default ScenicBackground;


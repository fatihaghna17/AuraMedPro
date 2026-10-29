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
            ? 'opacity-85 scale-100 filter brightness-100 contrast-105'
            : 'opacity-0 scale-105 pointer-events-none'
        }`}
      />

      {/* Background Celestial Vortex Image (Light Mode) */}
      <img
        src="/background-light.jpg"
        alt=""
        className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ${
          !isDark
            ? 'opacity-95 scale-100 filter brightness-100 contrast-105'
            : 'opacity-0 scale-105 pointer-events-none'
        }`}
      />

      {/* Atmospheric Base Color & Vignette for Content Readability */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark
            ? 'bg-gradient-to-b from-[#070b14]/50 via-[#0b101e]/20 to-[#070b14]/65'
            : 'bg-gradient-to-b from-white/20 via-transparent to-white/30'
        }`}
      />

      {/* Subtle Glowing Radial Aura to complement the vortex center */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700 ${
          isDark
            ? 'bg-gradient-to-tr from-teal-500/20 via-cyan-400/25 to-indigo-500/20'
            : 'bg-gradient-to-tr from-sky-400/25 via-teal-300/30 to-indigo-300/20'
        }`}
      />
    </div>
  );
};

export default ScenicBackground;


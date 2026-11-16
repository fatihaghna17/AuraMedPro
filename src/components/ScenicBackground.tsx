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
            ? 'opacity-80 scale-100 filter brightness-95 contrast-105 saturate-110'
            : 'opacity-0 scale-105 pointer-events-none'
        }`}
      />

      {/* Background Celestial Vortex Image (Light Mode) */}
      <img
        src="/background-light.jpg"
        alt=""
        className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ${
          !isDark
            ? 'opacity-90 scale-100 filter brightness-102 contrast-100 saturate-105'
            : 'opacity-0 scale-105 pointer-events-none'
        }`}
      />

      {/* Atmospheric Base Color & Vignette for Content Readability */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark
            ? 'bg-gradient-to-b from-[#070b14]/65 via-[#0b101e]/35 to-[#070b14]/75'
            : 'bg-gradient-to-b from-white/35 via-slate-50/15 to-white/45'
        }`}
      />

      {/* Ambient Light Pools for Liquid Glass Specular Refraction */}
      <div
        className={`absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full blur-[130px] pointer-events-none transition-opacity duration-700 ${
          isDark
            ? 'bg-indigo-500/15'
            : 'bg-sky-300/25'
        }`}
      />
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[520px] rounded-full blur-[150px] pointer-events-none transition-opacity duration-700 ${
          isDark
            ? 'bg-gradient-to-tr from-teal-500/15 via-cyan-400/20 to-indigo-500/15'
            : 'bg-gradient-to-tr from-sky-400/20 via-teal-300/25 to-indigo-300/20'
        }`}
      />
    </div>
  );
};

export default ScenicBackground;



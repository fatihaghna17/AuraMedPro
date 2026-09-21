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
      {/* Sky Base Gradient */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark
            ? 'bg-gradient-to-b from-[#070b14] via-[#10172a] to-[#1e1b4b]'
            : 'bg-gradient-to-b from-[#e0f2fe] via-[#f1f5f9] to-[#fed7aa]'
        }`}
      />

      {/* Cinematic Sunset/Twilight Horizon Glow */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[65vh] transition-opacity duration-700 ${
          isDark
            ? 'bg-gradient-to-t from-amber-600/20 via-rose-500/15 via-teal-500/10 to-transparent'
            : 'bg-gradient-to-t from-orange-400/30 via-amber-300/20 to-transparent'
        }`}
      />

      {/* Subtle Ambient Radial Light Orb */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none ${
          isDark
            ? 'bg-gradient-to-tr from-teal-500/15 via-indigo-500/20 to-amber-500/10'
            : 'bg-gradient-to-tr from-teal-300/30 via-amber-200/30 to-rose-200/20'
        }`}
      />

      {/* Mountain Layer 1: Far Distant Peaks */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-[36vh] min-h-[220px] max-h-[420px] object-cover preserve-3d"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,192L60,181.3C120,171,240,149,360,165.3C480,181,600,235,720,229.3C840,224,960,160,1080,149.3C1200,139,1320,181,1380,202.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          className={isDark ? 'fill-[#131c31]/60' : 'fill-[#cbd5e1]/70'}
        />
      </svg>

      {/* Mountain Layer 2: Midground Sharp Ridges */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-[30vh] min-h-[190px] max-h-[360px] object-cover"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,224L48,208C96,192,192,160,288,165.3C384,171,480,213,576,218.7C672,224,768,192,864,170.7C960,149,1056,139,1152,154.7C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          className={isDark ? 'fill-[#0d1527]/85' : 'fill-[#94a3b8]/80'}
        />
      </svg>

      {/* Mountain Layer 3: Foreground Majestic Silhouettes */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-[22vh] min-h-[140px] max-h-[260px] object-cover"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,256L40,245.3C80,235,160,213,240,218.7C320,224,400,256,480,250.7C560,245,640,203,720,192C800,181,880,203,960,218.7C1040,235,1120,245,1200,240C1280,235,1360,213,1400,202.7L1440,192L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"
          className={isDark ? 'fill-[#070b14]' : 'fill-[#64748b]/90'}
        />
      </svg>
    </div>
  );
};

export default ScenicBackground;

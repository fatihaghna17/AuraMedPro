import React, { useId } from 'react';

export interface BrandLogoProps {
  theme?: 'light' | 'dark';
  /**
   * 'auto' adapts app icon tile to theme ('dark' tile in dark mode, 'light' tile in light mode).
   * 'dark' / 'light' forces the specific squircle app icon variant.
   * 'mark' renders only the standalone transparent Aura Monogram A+ mark.
   */
  variant?: 'auto' | 'dark' | 'light' | 'mark';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  theme = 'dark',
  variant = 'auto',
  className = 'w-9 h-9',
}) => {
  const uid = useId().replace(/:/g, '');
  const resolved = variant === 'auto' ? (theme === 'dark' ? 'dark' : 'light') : variant;
  const isLightIcon = resolved === 'light';
  const isMarkOnly = resolved === 'mark';
  const useLightPalette = isLightIcon || (isMarkOnly && theme === 'light');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={isMarkOnly ? '22 24 212 208' : '0 0 256 256'}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
          {isLightIcon ? (
            <>
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#EEF2FF" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#1A2442" />
              <stop offset="1" stopColor="#0D1224" />
            </>
          )}
        </linearGradient>
        <radialGradient
          id={`${uid}-glowOuter`}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(0 120 120 0 120 120)"
        >
          <stop offset="0" stopColor="#6366F1" stopOpacity={useLightPalette ? 0.18 : 0.439} />
          <stop offset="0.5" stopColor="#8B5CF6" stopOpacity={useLightPalette ? 0.063 : 0.173} />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={`${uid}-glowCore`}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(0 48 48 0 48 48)"
        >
          <stop offset="0" stopColor="#38BDF8" stopOpacity={useLightPalette ? 0.141 : 0.282} />
          <stop offset="0.5" stopColor="#818CF8" stopOpacity={useLightPalette ? 0.047 : 0.094} />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-orbitThin`} x1="0" y1="44" x2="184" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38BDF8" stopOpacity={useLightPalette ? 0.267 : 0.188} />
          <stop offset="1" stopColor="#A855F7" stopOpacity={useLightPalette ? 0.267 : 0.22} />
        </linearGradient>
        <linearGradient id={`${uid}-orbitBold`} x1="0" y1="34" x2="168" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38BDF8" stopOpacity="0.867" />
          <stop offset="0.5" stopColor="#818CF8" />
          <stop offset="1" stopColor="#C084FC" stopOpacity="0.867" />
        </linearGradient>
        <linearGradient id={`${uid}-monoA`} x1="0" y1="0" x2="104" y2="116" gradientUnits="userSpaceOnUse">
          {useLightPalette ? (
            <>
              <stop offset="0" stopColor="#2563EB" />
              <stop offset="0.5" stopColor="#6366F1" />
              <stop offset="1" stopColor="#7C3AED" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#38BDF8" />
              <stop offset="0.5" stopColor="#6366F1" />
              <stop offset="1" stopColor="#A855F7" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38BDF8" stopOpacity={isLightIcon ? 0.267 : 0.333} />
          <stop offset="1" stopColor={isLightIcon ? '#8B5CF6' : '#A855F7'} stopOpacity={isLightIcon ? 0.267 : 0.333} />
        </linearGradient>
      </defs>

      {!isMarkOnly && (
        <path
          d="M60 0L196 0C211.913 0 227.174 6.321 238.426 17.574C249.679 28.826 256 44.087 256 60V196C256 211.913 249.679 227.174 238.426 238.426C227.174 249.679 211.913 256 196 256H60C44.087 256 28.826 249.679 17.574 238.426C6.321 227.174 0 211.913 0 196V60C0 44.087 6.321 28.826 17.574 17.574C28.826 6.321 44.087 0 60 0Z"
          fill={`url(#${uid}-bg)`}
        />
      )}

      <path
        transform="translate(8 8)"
        d="M240 120C240 171.987 206.525 218.062 157.082 234.127C107.639 250.192 53.475 232.593 22.918 190.534C-7.639 148.476 -7.639 91.524 22.918 49.466C53.475 7.407 107.639 -10.192 157.082 5.873C206.525 21.938 240 68.013 240 120"
        fill={`url(#${uid}-glowOuter)`}
      />
      <path
        transform="translate(80 94)"
        d="M96 48C96 68.795 82.61 87.225 62.833 93.651C43.056 100.077 21.39 93.037 9.167 76.214C-3.056 59.39 -3.056 36.61 9.167 19.786C21.39 2.963 43.056 -4.077 62.833 2.349C82.61 8.775 96 27.205 96 48"
        fill={`url(#${uid}-glowCore)`}
      />
      <path
        transform="matrix(0.939693 0.34202 -0.34202 0.939693 56.597 59.188)"
        d="M182.8 44C182.8 67.638 142.147 86.8 92 86.8C41.853 86.8 1.2 67.638 1.2 44C1.2 20.362 41.853 1.2 92 1.2C142.147 1.2 182.8 20.362 182.8 44"
        fill="none"
        stroke={`url(#${uid}-orbitThin)`}
        strokeWidth="2.4"
      />
      <path
        transform="matrix(0.939693 0.34202 -0.34202 0.939693 60.695 71.321)"
        d="M165.3 34C165.3 51.287 128.901 65.3 84 65.3C39.099 65.3 2.7 51.287 2.7 34C2.7 16.713 39.099 2.7 84 2.7C128.901 2.7 165.3 16.713 165.3 34"
        fill="none"
        stroke={`url(#${uid}-orbitBold)`}
        strokeWidth="5.4"
      />
      <path
        transform="translate(76 69.25)"
        d="M0 116L42 7.665C46 -2.555 58 -2.555 62 7.665L104 116"
        fill="none"
        stroke={`url(#${uid}-monoA)`}
        strokeWidth="18.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        transform="translate(121 121)"
        d="M7 0C10.866 0 14 3.134 14 7V35C14 38.866 10.866 42 7 42C3.134 42 0 38.866 0 35V7C0 3.134 3.134 0 7 0Z"
        fill={useLightPalette ? '#312E81' : '#FFFFFF'}
      />
      <path
        transform="translate(107 135)"
        d="M7 0H35C38.866 0 42 3.134 42 7C42 10.866 38.866 14 35 14H7C3.134 14 0 10.866 0 7C0 3.134 3.134 0 7 0Z"
        fill={useLightPalette ? '#312E81' : '#FFFFFF'}
      />
      <path
        transform="translate(174 54)"
        d="M16 0C18.2 10.2 21.8 13.8 32 16C21.8 18.2 18.2 21.8 16 32C13.8 21.8 10.2 18.2 0 16C10.2 13.8 13.8 10.2 16 0Z"
        fill={useLightPalette ? '#7C3AED' : '#7DD3FC'}
      />

      {!isMarkOnly && (
        <path
          d="M1 60C1 27.415 27.415 1 60 1H196C228.585 1 255 27.415 255 60V196C255 228.585 228.585 255 196 255H60C27.415 255 1 228.585 1 196Z"
          fill="none"
          stroke={`url(#${uid}-rim)`}
          strokeWidth="2"
        />
      )}
    </svg>
  );
};

export default BrandLogo;

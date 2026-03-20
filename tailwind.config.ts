import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#00D4FF',
          dim: 'rgba(0,212,255,0.15)',
          glow: 'rgba(0,212,255,0.35)',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.08)',
        },
        border: {
          subtle: 'rgba(255,255,255,0.08)',
          accent: 'rgba(0,212,255,0.4)',
        },
        muted: '#898989',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
      },
      keyframes: {
        'grid-pulse': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.7' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'grid-pulse': 'grid-pulse 4s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      backgroundImage: {
        'hero-grid': `linear-gradient(rgba(0,212,255,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.07) 1px, transparent 1px)`,
      },
      backgroundSize: {
        grid: '60px 60px',
      },
    },
  },
  plugins: [
    typography,
  ],
}

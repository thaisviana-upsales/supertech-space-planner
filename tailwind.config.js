/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Supertech Green palette
        green: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Supertech custom green
        supertech: {
          50:  '#edfff5',
          100: '#d5ffea',
          200: '#aeffd6',
          300: '#70ffb5',
          400: '#2bef87',  // primary action
          500: '#00d966',  // main brand
          600: '#00b352',
          700: '#008c42',
          800: '#006e35',
          900: '#005a2c',
          950: '#003319',
        },
        // Dark backgrounds
        dark: {
          50:  '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#adb5bd',
          400: '#6c757d',
          500: '#495057',
          600: '#343a40',
          700: '#212529',
          800: '#161b22',
          900: '#0d1117',
          950: '#090d12',
        },
        surface: {
          DEFAULT: '#111827',
          card:    '#1a2234',
          elevated:'#1f2d42',
          border:  '#2a3a52',
          hover:   '#243248',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-dark':     'linear-gradient(135deg, #090d12 0%, #0d1117 50%, #111827 100%)',
        'gradient-card':     'linear-gradient(135deg, #1a2234 0%, #1f2d42 100%)',
        'gradient-green':    'linear-gradient(135deg, #00d966 0%, #2bef87 100%)',
        'gradient-green-dk': 'linear-gradient(135deg, #00b352 0%, #00d966 100%)',
        'gradient-hero':     'radial-gradient(ellipse at top, #1a3a2a 0%, #090d12 60%)',
      },
      boxShadow: {
        'card':       '0 2px 16px 0 rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px 0 rgba(0,0,0,0.5)',
        'green-glow': '0 0 24px rgba(0,217,102,0.25)',
        'green-sm':   '0 0 12px rgba(0,217,102,0.15)',
        'inner-dark': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      borderRadius: {
        'xl2': '1rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-green': 'pulseGreen 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':   'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:    { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { '0%': { opacity: '0', transform: 'translateX(-16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseGreen: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.6' } },
      },
    },
  },
  plugins: [],
}

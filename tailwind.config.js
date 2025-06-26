/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        revolut: {
          blue: '#0074F6',
          purple: '#6C38FF',
          pink: '#FF3BFF',
          teal: '#00F0FF',
          dark: '#181A20',
          light: '#F5F7FA',
          gradient1: 'linear-gradient(135deg, #6C38FF 0%, #00F0FF 100%)',
          gradient2: 'linear-gradient(135deg, #0074F6 0%, #FF3BFF 100%)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      backgroundImage: {
        'revolut-gradient': 'linear-gradient(135deg, #6C38FF 0%, #00F0FF 100%)',
        'revolut-gradient-2': 'linear-gradient(135deg, #0074F6 0%, #FF3BFF 100%)',
      },
    },
  },
  plugins: [],
} 
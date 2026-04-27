/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'card-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95) translateY(-6px)' },
          '100%': { opacity: '1', transform: 'scale(1)   translateY(0)' },
        },
        'drop-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.65' },
        },
      },
      animation: {
        'card-in':    'card-in 0.22s ease-out',
        'drop-pulse': 'drop-pulse 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

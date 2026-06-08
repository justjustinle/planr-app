/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: '#FF5C00',
        cobalt: '#0038FF',
        forest: '#0A3D2A',
        cream:  '#F5F0E8',
        ink:    '#0A0A0A',
      },
      fontFamily: {
        headline: ['"Barlow Condensed"', '"Arial Black"', 'Impact', 'sans-serif'],
        body:     ['Barlow', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        brutal:           '4px 4px 0px 0px #0A0A0A',
        'brutal-sm':      '2px 2px 0px 0px #0A0A0A',
        'brutal-lg':      '6px 6px 0px 0px #0A0A0A',
        'brutal-orange':  '4px 4px 0px 0px #FF5C00',
        'brutal-cobalt':  '4px 4px 0px 0px #0038FF',
      },
      keyframes: {
        fadeSlideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeSlideUp 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};

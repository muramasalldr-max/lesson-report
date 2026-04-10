/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.html',
    './output/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0f7f1',
          100: '#d9edd9',
          200: '#b3dbb5',
          300: '#80bf85',
          400: '#4d9e56',
          500: '#2d7a38',
          600: '#1e5c28',
          700: '#184821',
          800: '#123519',
          900: '#0c2411',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
    },
  },
};

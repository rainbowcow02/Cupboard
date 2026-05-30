/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Avenir', 'system-ui', 'sans-serif'],
        condensed: ['"Avenir Next Condensed"', 'Avenir', 'sans-serif'],
      },
      colors: {
        pearl: '#f9eddd',
        moss: '#355c44',
        'supreme-beige': '#cca68c',
        burgundy: '#5d0505',
        'blossom-pink': '#fc999b',
        chardonnay: '#fdcb88',
        'grey-dark': '#6b6b6b',
        'grey-light': '#d9d9d9',
      },
    },
  },
  plugins: [],
};

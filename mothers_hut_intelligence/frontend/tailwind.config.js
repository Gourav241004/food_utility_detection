/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hut: {
          cream: '#FAF7F2',
          maroon: '#63131B',
          maroonDark: '#4D0E14',
          gold: '#F5C451',
          goldSoft: '#FFF8E7',
          ink: '#2A181A',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

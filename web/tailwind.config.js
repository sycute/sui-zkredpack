/** @type {import('tailwindcss').Config} */

export default {

  content: ['./index.html',
    './src/**/*.{js,jsx,ts,tsx}', 'node_modules/flowbite-react/lib/esm/**/*.js'],
  theme: {
    fontFamily: {
      sans: ["Press", "Start", "2P", "sans-serif"],
    },
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')
  ],
}


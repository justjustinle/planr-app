/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./planr-app/app/**/*.{js,ts,jsx,tsx,mdx}", // This covers your subfolder!
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#6366f1',
      }
    },
  },
  plugins: [],
}
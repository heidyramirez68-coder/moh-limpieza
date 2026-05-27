/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        moh: { purple: '#7C3AED', teal: '#0891B2', green: '#059669' }
      }
    }
  },
  plugins: []
}

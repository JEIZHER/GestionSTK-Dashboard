/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        starken: {
          red: '#E30613',
          bg: '#ffffffe8',
          text: '#333333',
          card: '#F5F5F5',
          border: '#E0E0E0',
          accent: '#FF3B30',
          success: '#34C759',
          warning: '#FF9800',
          error: '#DC3545',
          pxp: '#E53935'
        },
        dark: {
          bg: '#121212',
          text: '#E0E0E0',
          card: '#1E1E1E',
          border: '#363636'
        }
      }
    },
  },
  plugins: [],
}
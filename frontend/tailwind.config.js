/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        smartskale: {
          navy: '#1a1650',
          indigo: '#534AB7',
          lightIndigo: '#6c63d4',
          dark: '#0f0f0f',
          surface: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          inkMid: '#3a3a3a',
          inkLight: '#6b6b6b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['EB Garamond', 'serif']
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(26, 22, 80, 0.08)',
        'card': '0 10px 30px -4px rgba(26, 22, 80, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'preview': '0 20px 50px rgba(0, 0, 0, 0.18)',
      }
    },
  },
  plugins: [],
}

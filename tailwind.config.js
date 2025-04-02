/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Brand colors
          brand: {
            primary: {
              light: '#67e8f9', // cyan-300
              DEFAULT: '#06b6d4', // cyan-500
              dark: '#0891b2', // cyan-600
            },
            secondary: {
              light: '#5eead4', // teal-300
              DEFAULT: '#14b8a6', // teal-500
              dark: '#0d9488', // teal-600
            },
            accent: {
              light: '#fbbf24', // amber-400
              DEFAULT: '#f59e0b', // amber-500
              dark: '#d97706', // amber-600
            }
          }
        },
        animation: {
          'float': 'float 3s ease-in-out infinite',
          'loading-bar': 'loading 2s infinite',
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'bounce-slow': 'bounce 2s infinite',
        },
        keyframes: {
          float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          },
          loading: {
            '0%': { width: '0%' },
            '50%': { width: '70%' },
            '100%': { width: '100%' },
          },
          bounce: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-25px)' },
          }
        },
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        },
        boxShadow: {
          'inner-light': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        }
      },
    },
    plugins: [],
  }
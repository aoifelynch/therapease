/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TherapEase Primary Colors
        primary: {
          DEFAULT: '#6B7E5A',
          dark: '#5A6B4A',
          darker: '#4A5C3A',
          light: '#8FA67A',
          lighter: '#C8D5B9',
        },
        // TherapEase Secondary/Neutral Colors
        secondary: {
          cream: '#F5F0E8',
          beige: '#E5E0D8',
          sage: '#E8F0DF',
          charcoal: '#2D3A24',
        },
        // Semantic Colors
        therapease: {
          error: '#B91C1C',
          'error-bg': '#FEF2F2',
          'error-border': '#FECACA',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

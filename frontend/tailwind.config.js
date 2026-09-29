/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        groww: {
          50: '#F0FDF8',
          100: '#DCFCEE',
          200: '#BBF7DB',
          300: '#86EFC1',
          400: '#4CE0A4',
          500: '#00D09C', // Primary Groww Emerald
          600: '#00B386',
          700: '#008F6B',
          800: '#067056',
          900: '#065C47',
          950: '#023428',
        },
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 0 0 1px rgba(226, 232, 240, 0.8), 0 1px 3px 0 rgba(15, 23, 42, 0.03)',
        'card-hover': '0 0 0 1px rgba(203, 213, 225, 1), 0 4px 12px 0 rgba(15, 23, 42, 0.05)',
        'dropdown': '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
        'modal': '0 20px 35px -10px rgba(15, 23, 42, 0.15), 0 10px 15px -5px rgba(15, 23, 42, 0.08)',
      }
    },
  },
  plugins: [],
}

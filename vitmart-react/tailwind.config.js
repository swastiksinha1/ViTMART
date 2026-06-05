/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'jakarta': ['Outfit', 'sans-serif'],
        'syne': ['Outfit', 'sans-serif'],
        'display': ['Playfair Display', 'serif'],
        'body': ['Outfit', 'sans-serif'],
      },
      colors: {
        'vit': {
          '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd',
          '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9',
          '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065'
        },
        'cyan': {
          '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2'
        },
        'rose': {
          '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48'
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-18px)' } },
        'pulse-glow': { '0%, 100%': { boxShadow: '0 0 20px rgba(139,92,246,0.4)' }, '50%': { boxShadow: '0 0 50px rgba(139,92,246,0.8), 0 0 80px rgba(6,182,212,0.3)' } },
        shimmer: { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        'gradient-shift': { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
      }
    }
  },
  plugins: [],
}

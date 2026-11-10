/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ITEAM Maroon (primary — shield color from logo)
        iteam: {
          50:  '#FDF5F6',
          100: '#FAE8EB',
          200: '#F3C4CB',
          300: '#E8939F',
          400: '#D85C6E',
          500: '#C43049',
          600: '#8B1A2D',
          700: '#6B1422',
          800: '#4F0E19',
          900: '#370A12',
        },
        // ITEAM Navy (secondary — laurel branches from logo)
        navy: {
          50:  '#F0F3FF',
          100: '#DCE3FF',
          200: '#B3C2F9',
          300: '#7A96F0',
          400: '#4A6EE0',
          500: '#2547C5',
          600: '#1A2A5E',
          700: '#142244',
          800: '#0E1830',
          900: '#080F1E',
        },
        // Academic gold accent
        gold: {
          50:  '#FEFCF0',
          100: '#FDF5D0',
          200: '#FAE8A0',
          300: '#F5D360',
          400: '#E8B72B',
          500: '#C9941A',
          600: '#A67408',
          700: '#7A5406',
        },
        // Warm background
        warm: {
          50:  '#FBF8F8',
          100: '#F5EEEE',
          200: '#EDE0E0',
        },
        // Keep primary alias pointing to iteam
        primary: {
          50:  '#FDF5F6',
          100: '#FAE8EB',
          200: '#F3C4CB',
          300: '#E8939F',
          400: '#D85C6E',
          500: '#C43049',
          600: '#8B1A2D',
          700: '#6B1422',
          800: '#4F0E19',
          900: '#370A12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':   '0 1px 3px 0 rgba(139,26,45,0.06), 0 1px 2px -1px rgba(139,26,45,0.04)',
        'card-md':'0 4px 12px 0 rgba(139,26,45,0.10), 0 2px 4px -1px rgba(139,26,45,0.06)',
      },
    },
  },
  plugins: [],
}

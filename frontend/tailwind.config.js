/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6EE',
        ink: '#20261F',
        brand: {
          DEFAULT: '#1B6B4A',
          dark: '#0F4630',
          light: '#3E9270',
          50: '#EAF4EE'
        },
        marigold: {
          DEFAULT: '#F2B705',
          dark: '#C99400'
        },
        chili: {
          DEFAULT: '#D93D3D',
          dark: '#B22A2A'
        }
      },
      fontFamily: {
        display: ['"Baloo 2"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace']
      },
      boxShadow: {
        card: '0 2px 10px rgba(32,38,31,0.08)',
        pop: '0 8px 24px rgba(32,38,31,0.16)'
      }
    }
  },
  plugins: []
};

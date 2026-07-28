import type { Config } from 'tailwindcss';

// Official Gato Guarumo brand colors.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            light: '#59C377',
            DEFAULT: '#00A32E',
            dark: '#007220',
          },
          yellow: {
            light: '#FFEB59',
            DEFAULT: '#FFE000',
            dark: '#B39D00',
          },
        },
        ink: '#0F1210',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;

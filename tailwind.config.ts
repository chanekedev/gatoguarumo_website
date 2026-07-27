import type { Config } from 'tailwindcss';

// NOTE: placeholder hex values. Swap these for the exact colors sampled from
// the Gato Guarumo logo/brand sheet once available, then this is the only
// file that needs to change — everything else consumes `brand-*` tokens.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            light: '#6FBF3F',
            DEFAULT: '#3F7D20',
            dark: '#2C5916',
          },
          yellow: {
            light: '#FFE066',
            DEFAULT: '#FFC800',
            dark: '#E0A800',
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

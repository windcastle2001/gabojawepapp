import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          light: '#FCE8E2',
          foreground: 'hsl(var(--brand-foreground))',
        },
        'dm-blue': '#4F8E8A',
        'dm-blue-light': '#E4F2F0',
        'dm-mint': '#3F8F68',
        'dm-mint-light': '#E4F3EB',
        'dm-orange': '#D8953F',
        'dm-orange-light': '#F9EEDC',
        'dm-bg': '#FAF6F1',
        'dm-surface': '#FFFFFF',
        'dm-text': '#2B2521',
        'dm-mid': '#7B6F68',
        'dm-light': '#B9ADA6',
        'dm-border': '#EDE2D9',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontSize: {
        display: ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        heading: ['1.125rem', { lineHeight: '1.625rem', fontWeight: '700' }],
        subheading: ['0.9375rem', { lineHeight: '1.375rem', fontWeight: '500' }],
        body: ['0.875rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
      },
      fontFamily: {
        sans: ['var(--font-noto)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;

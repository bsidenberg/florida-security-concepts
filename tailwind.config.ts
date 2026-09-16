import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic palette: light reading surfaces with explicitly scoped navy panels.
        fsc: {
          bg: 'rgb(var(--fsc-bg) / <alpha-value>)',
          surface: 'rgb(var(--fsc-surface) / <alpha-value>)',
          'surface-2': 'rgb(var(--fsc-surface-2) / <alpha-value>)',
          border: 'rgb(var(--fsc-border) / <alpha-value>)',
          'border-strong': 'rgb(var(--fsc-border-strong) / <alpha-value>)',
          text: 'rgb(var(--fsc-text) / <alpha-value>)',
          'text-dim': 'rgb(var(--fsc-text-dim) / <alpha-value>)',
          'text-muted': 'rgb(var(--fsc-text-muted) / <alpha-value>)',
          accent: 'rgb(var(--fsc-accent) / <alpha-value>)',
          'accent-glow': 'rgb(var(--fsc-accent-glow) / <alpha-value>)',
          'accent-deep': 'rgb(var(--fsc-accent-deep) / <alpha-value>)',
          warn: 'rgb(var(--fsc-warn) / <alpha-value>)',
          danger: 'rgb(var(--fsc-danger) / <alpha-value>)',
          ok: 'rgb(var(--fsc-ok) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'fsc-grid':
          'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)',
        'fsc-radial':
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.18) 0%, rgba(7,10,19,0) 60%)',
        'fsc-card':
          'linear-gradient(rgb(var(--fsc-surface)), rgb(var(--fsc-surface)))',
        'fsc-hairline':
          'linear-gradient(135deg, rgba(96,165,250,0.6) 0%, rgba(31,41,64,0) 30%, rgba(31,41,64,0) 70%, rgba(96,165,250,0.4) 100%)',
      },
      boxShadow: {
        'fsc-card':
          '0 6px 22px rgba(21,44,62,0.04)',
        'fsc-card-hover':
          '0 10px 28px rgba(21,44,62,0.09)',
        'fsc-glow':
          '0 0 0 1px rgba(96,165,250,0.5), 0 0 30px rgba(59,130,246,0.35)',
      },
      letterSpacing: {
        'fsc-eyebrow': '0.18em',
      },
    },
  },
  plugins: [],
};

export default config;

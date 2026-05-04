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
        // Florida Security Concepts palette — deep slate w/ steel-blue accent
        fsc: {
          bg: '#070a13',
          surface: '#0f1422',
          'surface-2': '#161c2e',
          border: '#1f2940',
          'border-strong': '#2a3450',
          text: '#e2e8f0',
          'text-dim': '#94a3b8',
          'text-muted': '#64748b',
          accent: '#3b82f6',
          'accent-glow': '#60a5fa',
          'accent-deep': '#1d4ed8',
          warn: '#f59e0b',
          danger: '#ef4444',
          ok: '#10b981',
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
          'linear-gradient(180deg, rgba(22,28,46,0.85) 0%, rgba(15,20,34,0.85) 100%)',
        'fsc-hairline':
          'linear-gradient(135deg, rgba(96,165,250,0.6) 0%, rgba(31,41,64,0) 30%, rgba(31,41,64,0) 70%, rgba(96,165,250,0.4) 100%)',
      },
      boxShadow: {
        'fsc-card':
          '0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(31,41,64,0.8), 0 24px 48px -24px rgba(0,0,0,0.6)',
        'fsc-card-hover':
          '0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(96,165,250,0.4), 0 28px 60px -20px rgba(59,130,246,0.25)',
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

/** @type {import('tailwindcss').Config} */
// Colors are wired to CSS custom properties (RGB channel triples) so the whole
// palette can shift from one place and Tailwind opacity modifiers still work.
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: withVar('--c-bg'),
        surface: withVar('--c-surface'),
        elevated: withVar('--c-elevated'),
        ivory: withVar('--c-ivory'),
        border: withVar('--c-border'),
        ink: withVar('--c-text'),
        muted: withVar('--c-muted'),
        panel: withVar('--c-panel'),
        navy: withVar('--c-navy'),
        primary: {
          DEFAULT: withVar('--c-primary'),
          fg: withVar('--c-primary-fg'),
          soft: withVar('--c-primary-soft'),
          strong: withVar('--c-primary-strong'),
        },
        teal: withVar('--c-teal'),
        purple: withVar('--c-purple'),
        accent: withVar('--c-accent'),
        approved: withVar('--c-approved'),
        borderline: withVar('--c-borderline'),
        rejected: withVar('--c-rejected'),
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-body)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 0.35rem)',
        '2xl': 'calc(var(--radius) + 0.75rem)',
      },
      boxShadow: {
        card: '0 1px 2px rgb(28 25 23 / 0.04), 0 1px 3px rgb(28 25 23 / 0.06)',
        lift: '0 2px 4px rgb(28 25 23 / 0.05), 0 12px 28px -10px rgb(28 25 23 / 0.18)',
        pop: '0 12px 40px -12px rgb(28 25 23 / 0.22)',
        glow: '0 0 0 1px rgb(var(--c-primary) / 0.12), 0 10px 30px -10px rgb(var(--c-primary) / 0.35)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

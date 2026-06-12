/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        // Surfaces and the primary accent read CSS variables so the whole
        // palette re-tints with the active atmosphere (see index.css).
        cockpit: {
          deep: 'rgb(var(--surface-deep) / <alpha-value>)',
          base: 'rgb(var(--surface-base) / <alpha-value>)',
          panel: 'rgb(var(--surface-panel) / <alpha-value>)',
          border: 'rgb(var(--surface-border) / <alpha-value>)',
          glass: 'rgba(255, 255, 255, 0.04)',
        },
        ch: {
          cyan: 'rgb(var(--accent) / <alpha-value>)',
          'cyan-dim': 'rgb(var(--accent-dim) / <alpha-value>)',
          amber: '#fbbf24',
          'amber-dim': '#b45309',
          magenta: '#f472b6',
          'magenta-dim': '#be185d',
          emerald: '#34d399',
          'emerald-dim': '#059669',
          red: '#f87171',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgb(var(--accent) / 0.22)',
        'glow-amber': '0 0 20px rgba(251, 191, 36, 0.25)',
        'glow-magenta': '0 0 20px rgba(244, 114, 182, 0.25)',
        'glow-emerald': '0 0 20px rgba(52, 211, 153, 0.25)',
      },
    },
  },
  plugins: [],
}

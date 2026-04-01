/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        cockpit: {
          deep: '#020617',
          base: '#0f172a',
          panel: '#1e293b',
          border: '#334155',
          glass: 'rgba(255, 255, 255, 0.04)',
        },
        ch: {
          cyan: '#22d3ee',
          'cyan-dim': '#0891b2',
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
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.25)',
        'glow-amber': '0 0 20px rgba(251, 191, 36, 0.25)',
        'glow-magenta': '0 0 20px rgba(244, 114, 182, 0.25)',
        'glow-emerald': '0 0 20px rgba(52, 211, 153, 0.25)',
      },
    },
  },
  plugins: [],
}

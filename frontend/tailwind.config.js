export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'glass-bg': 'rgba(255,255,255,0.045)',
        'glass-border': 'rgba(255,255,255,0.14)',
        'visionos-purple': '#8b5cf6',
        'visionos-cyan': '#22d3ee',
      },
      boxShadow: {
        'glass-glow': '0 20px 70px rgba(125, 95, 255, 0.16)',
        'glass-inset': 'inset 0 1px 0 rgba(255,255,255,0.22)',
        'glass-deep': '0 8px 32px 0 rgba(0,0,0,0.45), 0 32px 80px rgba(0,0,0,0.35)',
        'glass-card': 'inset 0 1px 0 rgba(255,255,255,0.16), 0 20px 60px rgba(0,0,0,0.24)',
        'glass-bubble': 'inset 0 1px 0 rgba(255,255,255,0.38), 0 8px 32px 0 rgba(0,0,0,0.22)',
      },
      backdropBlur: {
        glass: '28px',
        glassXl: '36px',
      },
      keyframes: {
        'mesh-float': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(2%, -3%, 0) scale(1.08)' },
        },
      },
      animation: {
        'mesh-float': 'mesh-float 22s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
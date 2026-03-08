/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        accent: {
          pink: '#ec4899',
          sky: '#0ea5e9',
          amber: '#f59e0b',
          emerald: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-delayed': 'float 3s ease-in-out 1s infinite',
        'orbit': 'orbit 4s linear infinite',
        'orbit-slow': 'orbit 7s linear infinite',
        'orbit-reverse': 'orbit-reverse 5s linear infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'wand': 'wand-wave 1.2s ease-in-out infinite',
        'agent-think': 'agent-think 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'confetti': 'confetti-fall 1s ease-out forwards',
        'border-dance': 'border-dance 3s ease-in-out infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'typing-cursor': 'typing-cursor 0.8s ease infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-16px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.92)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        orbit: {
          from: { transform: 'rotate(0deg) translateX(24px) rotate(0deg)' },
          to: { transform: 'rotate(360deg) translateX(24px) rotate(-360deg)' },
        },
        'orbit-reverse': {
          from: { transform: 'rotate(360deg) translateX(18px) rotate(-360deg)' },
          to: { transform: 'rotate(0deg) translateX(18px) rotate(0deg)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0.5) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1) rotate(180deg)' },
        },
        'wand-wave': {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '50%': { transform: 'rotate(12deg)' },
        },
        'agent-think': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.06)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.4' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(40px) rotate(360deg)', opacity: '0' },
        },
        'border-dance': {
          '0%, 100%': { borderColor: 'rgba(99, 68, 236, 0.3)' },
          '33%': { borderColor: 'rgba(236, 72, 153, 0.3)' },
          '66%': { borderColor: 'rgba(14, 165, 233, 0.3)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'typing-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      boxShadow: {
        'glow-indigo': '0 0 24px rgba(99, 68, 236, 0.18), 0 0 64px rgba(99, 68, 236, 0.06)',
        'glow-pink': '0 0 24px rgba(236, 72, 153, 0.18), 0 0 64px rgba(236, 72, 153, 0.06)',
        'glow-sky': '0 0 24px rgba(14, 165, 233, 0.18), 0 0 64px rgba(14, 165, 233, 0.06)',
        'glow-emerald': '0 0 24px rgba(16, 185, 129, 0.18), 0 0 64px rgba(16, 185, 129, 0.06)',
        'soft': '0 2px 8px rgba(99, 68, 236, 0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card': '0 4px 16px rgba(99, 68, 236, 0.06), 0 1px 4px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 30px rgba(99, 68, 236, 0.10), 0 2px 8px rgba(0,0,0,0.04)',
        'elevated': '0 20px 50px rgba(99, 68, 236, 0.10), 0 8px 20px rgba(0,0,0,0.04)',
      },
      screens: {
        'xs': '475px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

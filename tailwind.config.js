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
          50: '#edfcff',
          100: '#d6f7ff',
          200: '#b5f0ff',
          300: '#83e8ff',
          400: '#48d4ff',
          500: '#00d4ff',
          600: '#00a8d6',
          700: '#0086ad',
          800: '#006b8e',
          900: '#065876',
          950: '#04394f',
        },
        secondary: {
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
        surface: {
          primary: 'rgb(8, 10, 18)',
          secondary: 'rgb(14, 17, 30)',
          elevated: 'rgb(20, 24, 42)',
          card: 'rgb(22, 27, 48)',
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
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'orbit': 'orbit 3s linear infinite',
        'orbit-slow': 'orbit 6s linear infinite',
        'orbit-reverse': 'orbit 4s linear infinite reverse',
        'float': 'float 3s ease-in-out infinite',
        'float-delayed': 'float 3s ease-in-out 1s infinite',
        'agent-think': 'agent-think 1.5s ease-in-out infinite',
        'border-glow': 'border-glow 2s ease-in-out infinite',
        'progress-flow': 'progress-flow 3s ease infinite',
        'scan-line': 'scan-line 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        orbit: {
          from: { transform: 'rotate(0deg) translateX(10px) rotate(0deg)' },
          to: { transform: 'rotate(360deg) translateX(10px) rotate(-360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'agent-think': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(0, 212, 255, 0.15)' },
          '50%': { borderColor: 'rgba(0, 212, 255, 0.4)' },
        },
        'progress-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'scan-line': {
          '0%': { top: '-2px' },
          '100%': { top: '100%' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.15), 0 0 60px rgba(0, 212, 255, 0.05)',
        'glow-violet': '0 0 20px rgba(139, 92, 246, 0.15), 0 0 60px rgba(139, 92, 246, 0.05)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.15), 0 0 60px rgba(16, 185, 129, 0.05)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.15), 0 0 60px rgba(244, 63, 94, 0.05)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'elevated': '0 20px 50px rgba(0, 0, 0, 0.4)',
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

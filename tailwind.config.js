/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#131318',
        surface: '#131318',
        'surface-dim': '#131318',
        'surface-bright': '#39383e',
        'surface-container-lowest': '#0e0e13',
        'surface-container-low': '#1b1b20',
        'surface-container': '#1f1f25',
        'surface-container-high': '#2a292f',
        'surface-container-highest': '#35343a',
        'on-surface': '#e4e1e9',
        'on-surface-variant': '#cbc3d7',
        'inverse-surface': '#e4e1e9',
        'inverse-on-surface': '#303036',
        outline: '#958ea0',
        'outline-variant': '#494454',
        'surface-tint': '#d0bcff',
        primary: '#d0bcff',
        'on-primary': '#3c0091',
        'primary-container': '#a078ff',
        'on-primary-container': '#340080',
        'inverse-primary': '#6d3bd7',
        secondary: '#ffb0cd',
        'on-secondary': '#640039',
        'secondary-container': '#aa0266',
        'on-secondary-container': '#ffbad3',
        tertiary: '#c6c6c7',
        'on-tertiary': '#2f3131',
        'tertiary-container': '#909191',
        'on-tertiary-container': '#282a2a',
        error: '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',
        
        // Custom branding accents from DESIGN.md
        'accent-violet': '#8b5cf6',
        'accent-pink': '#ec4899',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        hanken: ['Hanken Grotesk', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
      spacing: {
        'split-left': '55%',
        'split-right': '45%',
        'margin-mobile': '20px',
        'margin-desktop': '48px',
        gutter: '24px',
      }
    },
  },
  plugins: [],
}

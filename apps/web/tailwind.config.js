/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: '#ffffff',
        ink: '#000000',
        surface: '#f0f0f0',
        'surface-subtle': '#f7f7f7',
        accent: '#c90000',
        'accent-dark': '#a30000',
        rule: '#000000',
        'rule-light': '#e0e0e0',
        'rule-subtle': '#ebebeb',
        muted: '#555555',
        'muted-light': '#777777',
      },
      fontFamily: {
        sans: ['"Host Grotesk"', 'SwissMinimalistHost', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      letterSpacing: {
        label: '0.12em',
      },
      borderWidth: {
        'rule': '2px',
      },
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        full: '0',
      }
    },
  },
  plugins: [],
}

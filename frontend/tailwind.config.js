module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F4F4F5',
        foreground: '#18181B',
        card: '#FFFFFF',
        'card-foreground': '#18181B',
        primary: '#FF6600',
        'primary-foreground': '#FFFFFF',
        secondary: '#18181B',
        'secondary-foreground': '#FFFFFF',
        muted: '#F4F4F5',
        'muted-foreground': '#71717A',
        accent: '#FFF7ED',
        'accent-foreground': '#FF6600',
        destructive: '#EF4444',
        'destructive-foreground': '#FFFFFF',
        border: '#E4E4E7',
        input: '#E4E4E7',
        ring: '#FF6600',
      },
      fontFamily: {
        heading: ['Oswald', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
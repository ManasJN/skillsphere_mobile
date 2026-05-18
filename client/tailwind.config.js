/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#030b1d', 2: '#081225', 3: '#0b1630', 4: '#10192f' },
        card:   { DEFAULT: '#10192f', 2: '#111c35' },
        border: { DEFAULT: '#1e293b', 2: '#253552' },
        indigo: { DEFAULT: '#4f46e5', 2: '#6366f1' },
        cyan:   { DEFAULT: '#06b6d4' },
        purple: { DEFAULT: '#8b5cf6' },
        pink:   { DEFAULT: '#ec4899' },
        emerald:{ DEFAULT: '#10b981' },
        amber:  { DEFAULT: '#f59e0b' },
        rose:   { DEFAULT: '#ef4444' },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

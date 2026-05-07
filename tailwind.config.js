/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // BADAWIA'S IMPORTS brand palette — navy / red / cyan
        primary: {
          DEFAULT: '#0D1B45',   // deep navy (logo text)
          soft: '#E8EDF8',      // very light navy tint
          light: '#6B7FBF',     // lighter navy for accents
          dark: '#060E28',      // darkest navy for hover / footer
        },
        accent: {
          DEFAULT: '#CC1414',   // brand red (logo swoosh)
          muted: '#FAD5D5',     // light red for chips, badges
        },
        cyan: {
          DEFAULT: '#1ABCDF',   // logo cyan (transport icons)
          soft: '#D6F4FB',      // very light cyan
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F7F8FC',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        handwriting: ['Pacifico', 'cursive'],
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.333333%)' },
        },
      },
    },
  },
  plugins: [],
}

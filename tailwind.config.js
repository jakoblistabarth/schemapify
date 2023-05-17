/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["InterVariable", "system-ui", "sans-serif"],
        display: ['"DM Sans"', "serif"],
        mono: ['"DM Mono"', "mono"],
      },
      zIndex: {
        "above-map": "625",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter Variable", "system-ui", "sans-serif"],
        display: ['"DM Sans Variable"', "serif"],
        mono: ['"DM Mono"', "mono"],
      },
      zIndex: {
        "above-map": "625",
      },
    },
  },
  plugins: [require("@savvywombat/tailwindcss-grid-areas")],
};

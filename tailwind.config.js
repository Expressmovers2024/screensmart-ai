/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#030712",
        panel: "#0F172A",
        electric: "#60A5FA",
        mint: "#2DD4BF"
      }
    }
  },
  plugins: []
};

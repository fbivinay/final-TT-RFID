/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#080b10",
          900: "#0d121a",
          850: "#111923",
          800: "#18222e",
          700: "#243241"
        },
        signal: {
          green: "#8df589",
          cyan: "#74d8ff",
          yellow: "#ffd166",
          orange: "#ff9b6a",
          red: "#ff6b7a"
        }
      },
      boxShadow: {
        glow: "0 0 36px rgba(116, 216, 255, 0.12)"
      }
    }
  },
  plugins: []
};

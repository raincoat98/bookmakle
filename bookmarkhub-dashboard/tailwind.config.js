module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(-10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "fade-in-simple": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out-simple": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "slide-in-left": "slide-in-left 0.3s cubic-bezier(0.4,0,0.2,1) both",
        "fade-in": "fade-in 0.2s cubic-bezier(0.4,0,0.2,1) both",
        "fade-in-simple": "fade-in-simple 0.3s cubic-bezier(0.4,0,0.2,1) both",
        "fade-out-simple":
          "fade-out-simple 0.3s cubic-bezier(0.4,0,0.2,1) both",
      },
    },
  },
  plugins: [],
};

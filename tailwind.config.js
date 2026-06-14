/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#EFF6FD",
          100: "#D9EAFB",
          200: "#B3D4F6",
          300: "#8DBEF1",
          400: "#67A8EC",
          500: "#4A90D9",
          600: "#3A74B0",
          700: "#2B5884",
          800: "#1C3C58",
          900: "#0D202C",
        },
        success: {
          50: "#F0FAF3",
          100: "#DBF3E1",
          200: "#B7E7C3",
          300: "#93DBA5",
          400: "#6FCF87",
          500: "#5CB85C",
          600: "#4A934A",
          700: "#376E37",
          800: "#254925",
          900: "#122512",
        },
        danger: {
          50: "#FDF0EF",
          100: "#F9DAD8",
          200: "#F3B5B1",
          300: "#ED908A",
          400: "#E76B63",
          500: "#D9534F",
          600: "#AE423F",
          700: "#82322F",
          800: "#572120",
          900: "#2B1110",
        },
        warning: {
          50: "#FFF8E6",
          100: "#FFEFB3",
          200: "#FFE580",
          300: "#FFDB4D",
          400: "#FFD11A",
          500: "#E6B800",
          600: "#B38F00",
          700: "#806600",
          800: "#4D3D00",
          900: "#1A1400",
        },
      },
      fontFamily: {
        sans: ["'Noto Sans SC'", "'Poppins'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        page: "#F7F7F2",
        card: "#FFFFFF",
        emerald: {
          DEFAULT: "#0F8B6D",
          hover: "#0B7057",
          light: "#E8F5F0",
          50: "#F0FDF8",
          100: "#E8F5F0",
          200: "#B8EAD9",
          500: "#0F8B6D",
          600: "#0B7057",
          700: "#085441",
          800: "#064032"
        },
        teal: {
          DEFAULT: "#2A9D8F",
          hover: "#238276",
          50: "#EAF6F5",
          100: "#D5ECE9",
          500: "#2A9D8F",
          600: "#238276"
        },
        charcoal: {
          DEFAULT: "#1F2933",
          secondary: "#667085",
          muted: "#98A2B3",
          light: "#E4E7EC"
        },
        border: {
          DEFAULT: "#E7E7E0",
          subtle: "#EFEFE9",
          light: "#E7E7E0"
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F7F7F2",
          subtle: "#FAFAF7",
          green: "#E8F5F0"
        },
        success: "#0F8B6D",
        warning: "#D97706",
        danger: "#C94C4C"
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        card: "0 2px 6px 0 rgba(0, 0, 0, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.02)",
        'card-hover': "0 8px 20px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -4px rgba(0, 0, 0, 0.03)",
        dropdown: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
      }
    }
  },
  plugins: []
};

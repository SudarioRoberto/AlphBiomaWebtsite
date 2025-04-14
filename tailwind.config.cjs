/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0048b5",
          dark: "#003c95",
          light: "#3533c9"
        },
        secondary: "#215ec3",
        accent: "#326bc3",
      },
    },
  },
  plugins: [],
}
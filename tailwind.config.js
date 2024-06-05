/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      backgroundImage: (theme) => ({
        "welcome-image": "url('/public/images/Minecraft_welcome_banner.png')",
      }),
    },
  },
  variants: {},
  plugins: [require('tailwind-scrollbar-hide')],
};

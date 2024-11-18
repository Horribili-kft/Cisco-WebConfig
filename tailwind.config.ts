import type { Config } from "tailwindcss";

// Az első téma ami itt meg van adva az alapértelmezett.
// Sütiben tárolódik a kiválasztott téma
export const themes = ["dark", "light", "black", "retro", "dracula", "cmyk", "synthwave", "aqua", "cyberpunk", "wireframe", "cupcake"]

// We export the type of themes as well for the settings store (and anywhere else that it is needed really)
export type Theme = typeof themes[number];


const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: themes,
  },
};
export default config;

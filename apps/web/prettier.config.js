import baseConfig from "../../prettier.config.mjs";

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  ...baseConfig,
  plugins: ["prettier-plugin-tailwindcss"],
};

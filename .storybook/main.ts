import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-themes"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal(config) {
    return mergeConfig(config, {
      define: {
        "process.env": {},
      },
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "../src"),
          "next/link": path.resolve(__dirname, "mocks/next-link.tsx"),
          "next/image": path.resolve(__dirname, "mocks/next-image.tsx"),
          "next/navigation": path.resolve(
            __dirname,
            "mocks/next-navigation.ts",
          ),
        },
      },
      css: {
        postcss: path.resolve(__dirname, ".."),
      },
    });
  },
};

export default config;

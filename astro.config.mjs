import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://andyvi.ru",
  output: "static",
  adapter: node({
    mode: "standalone",
  }),
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
});

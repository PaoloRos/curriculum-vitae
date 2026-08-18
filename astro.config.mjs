import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://paoloros.github.io",
  base: "/curriculum-vitae",
  output: "static",
  build: {
    format: "directory"
  }
});

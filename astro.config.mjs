import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://paoloros.github.io",
  output: "static",
  build: {
    format: "directory"
  }
});


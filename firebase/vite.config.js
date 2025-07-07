import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "public",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "public/index.html"),
        config: resolve(__dirname, "public/config.html"),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  plugins: [
    {
      name: "copy-env-files",
      generateBundle() {
        // env.js 파일을 public으로 복사
        this.emitFile({
          type: "asset",
          fileName: "env.js",
          source: require("fs").readFileSync(resolve(__dirname, "env.js")),
        });
      },
    },
  ],
});

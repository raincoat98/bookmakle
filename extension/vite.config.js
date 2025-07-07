import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/background.js"),
        popup: resolve(__dirname, "src/popup/popup.js"),
        offscreen: resolve(__dirname, "src/public/offscreen.js"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  plugins: [
    {
      name: "copy-public-files",
      generateBundle() {
        // public 폴더의 파일들을 dist로 복사
        this.emitFile({
          type: "asset",
          fileName: "manifest.json",
          source: require("fs").readFileSync(
            resolve(__dirname, "src/public/manifest.json")
          ),
        });
        this.emitFile({
          type: "asset",
          fileName: "offscreen.html",
          source: require("fs").readFileSync(
            resolve(__dirname, "src/public/offscreen.html")
          ),
        });
        this.emitFile({
          type: "asset",
          fileName: "popup.html",
          source: require("fs").readFileSync(
            resolve(__dirname, "src/popup/popup.html")
          ),
        });
      },
    },
  ],
});

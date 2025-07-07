import { defineConfig } from "vite";
import { resolve } from "path";
import { readdirSync, readFileSync, statSync } from "fs";

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
          source: readFileSync(resolve(__dirname, "src/public/manifest.json")),
        });
        this.emitFile({
          type: "asset",
          fileName: "offscreen.html",
          source: readFileSync(resolve(__dirname, "src/public/offscreen.html")),
        });
        this.emitFile({
          type: "asset",
          fileName: "popup.html",
          source: readFileSync(resolve(__dirname, "src/popup/popup.html")),
        });

        // _locales 폴더 복사
        const localesPath = resolve(__dirname, "src/public/_locales");
        if (statSync(localesPath).isDirectory()) {
          const locales = readdirSync(localesPath);
          locales.forEach((locale) => {
            const localePath = resolve(localesPath, locale);
            if (statSync(localePath).isDirectory()) {
              const messagesPath = resolve(localePath, "messages.json");
              if (statSync(messagesPath).isFile()) {
                this.emitFile({
                  type: "asset",
                  fileName: `_locales/${locale}/messages.json`,
                  source: readFileSync(messagesPath),
                });
              }
            }
          });
        }
      },
    },
  ],
});

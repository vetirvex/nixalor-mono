import { defineConfig } from "vite";

export default defineConfig({
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
  optimizeDeps: {
    // Pre-bundle every dependency up front. Otherwise Vite discovers some of
    // them only at runtime, re-optimizes and changes chunk hashes, and an open
    // tab fails with "Failed to fetch dynamically imported module".
    include: [
      "@excalidraw/excalidraw",
      "@codemirror/autocomplete",
      "@codemirror/commands",
      "@codemirror/lang-markdown",
      "@codemirror/language",
      "@codemirror/language-data",
      "@codemirror/state",
      "@codemirror/view",
      "@lezer/highlight",
      "dompurify",
      "lucide-react",
      "marked",
      "react",
      "react-dom",
      "react-dom/client",
    ],
  },
});

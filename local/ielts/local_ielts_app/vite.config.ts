import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/my-ielts-site/mod/ielts/build/",
  build: {
    outDir: "../../../mod/ielts/build",
    emptyOutDir: true,
    // Let Vite handle code splitting automatically
  },
});

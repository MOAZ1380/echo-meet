import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default ({ mode }: { mode: string }) => {
  // يحمل متغيرات البيئة حسب الـ mode (development / production)
  const env = loadEnv(mode, process.cwd());

  return defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_URL, // هنا استخدمنا المتغير
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  });
};

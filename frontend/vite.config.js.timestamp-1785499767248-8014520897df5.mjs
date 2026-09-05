// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/02/Desktop/GliceChart/frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/02/Desktop/GliceChart/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        // In sviluppo locale: gira le chiamate /api al backend Node
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: "dist",
      // Ottimizzazioni per mobile
      rollupOptions: {
        output: {
          manualChunks: {
            // Separa le librerie pesanti
            "chart-vendor": ["chart.js", "vue-chartjs", "chartjs-plugin-annotation", "chartjs-plugin-zoom"],
            "vue-vendor": ["vue", "vue-router", "pinia"]
          }
        }
      },
      // Riduce la dimensione del bundle
      chunkSizeWarningLimit: 1e3
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFwwMlxcXFxEZXNrdG9wXFxcXEdsaWNlQ2hhcnRcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXDAyXFxcXERlc2t0b3BcXFxcR2xpY2VDaGFydFxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvMDIvRGVza3RvcC9HbGljZUNoYXJ0L2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgLy8gQ2FyaWNhIGxlIHZhcmlhYmlsaSBkJ2FtYmllbnRlIGRhbGxhIGNhcnRlbGxhIGJhY2tlbmRcclxuICAvLyBJbiBzdmlsdXBwbyBsb2NhbGUgdXNhIGlsIHByb3h5IHZlcnNvIGxvY2FsaG9zdDozMDAxXHJcbiAgLy8gSW4gcHJvZHV6aW9uZSBpbCBmcm9udGVuZCBnaXJhIHN1bGxvIHN0ZXNzbyBzZXJ2ZXIsIHF1aW5kaSAvYXBpIGZ1bnppb25hIGRpcmV0dGFtZW50ZVxyXG4gIHJldHVybiB7XHJcbiAgICBwbHVnaW5zOiBbdnVlKCldLFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IDUxNzMsXHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgLy8gSW4gc3ZpbHVwcG8gbG9jYWxlOiBnaXJhIGxlIGNoaWFtYXRlIC9hcGkgYWwgYmFja2VuZCBOb2RlXHJcbiAgICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxyXG4gICAgICAvLyBPdHRpbWl6emF6aW9uaSBwZXIgbW9iaWxlXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgICAvLyBTZXBhcmEgbGUgbGlicmVyaWUgcGVzYW50aVxyXG4gICAgICAgICAgICAnY2hhcnQtdmVuZG9yJzogWydjaGFydC5qcycsICd2dWUtY2hhcnRqcycsICdjaGFydGpzLXBsdWdpbi1hbm5vdGF0aW9uJywgJ2NoYXJ0anMtcGx1Z2luLXpvb20nXSxcclxuICAgICAgICAgICAgJ3Z1ZS12ZW5kb3InOiBbJ3Z1ZScsICd2dWUtcm91dGVyJywgJ3BpbmlhJ10sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICAvLyBSaWR1Y2UgbGEgZGltZW5zaW9uZSBkZWwgYnVuZGxlXHJcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVQsU0FBUyxjQUFjLGVBQWU7QUFDelYsT0FBTyxTQUFTO0FBRWhCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBSXhDLFNBQU87QUFBQSxJQUNMLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFBQSxJQUNmLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQTtBQUFBLFFBRUwsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQTtBQUFBLE1BRVIsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBO0FBQUEsWUFFWixnQkFBZ0IsQ0FBQyxZQUFZLGVBQWUsNkJBQTZCLHFCQUFxQjtBQUFBLFlBQzlGLGNBQWMsQ0FBQyxPQUFPLGNBQWMsT0FBTztBQUFBLFVBQzdDO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BRUEsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

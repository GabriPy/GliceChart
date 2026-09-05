import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  // Carica le variabili d'ambiente dalla cartella backend
  // In sviluppo locale usa il proxy verso localhost:3001
  // In produzione il frontend gira sullo stesso server, quindi /api funziona direttamente
  return {
    plugins: [vue()],
    server: {
      host: '0.0.0.0', // Permette accesso dalla rete locale
      port: 5173,
      proxy: {
        // In sviluppo locale: gira le chiamate /api al backend Node
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    },
    build: {
      outDir: 'dist',
      // Ottimizzazioni per mobile
      rollupOptions: {
        output: {
          manualChunks: {
            // Separa le librerie pesanti
            'chart-vendor': ['chart.js', 'vue-chartjs', 'chartjs-plugin-annotation', 'chartjs-plugin-zoom'],
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
          }
        }
      },
      // Riduce la dimensione del bundle
      chunkSizeWarningLimit: 1000,
    }
  }
})

// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue']
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          sourceMap: true
        }
      }
    }),
    vuetify({ autoImport: true }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Core POS',
        short_name: 'Core POS',
        description: 'Core POS System',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['xstate'],
      output: {
        manualChunks: {
          'vuetify': ['vuetify'],
          'xstate': ['xstate']
        },
        // Remove the assets/ prefix since the base output already includes it
        assetFileNames: '[name].[hash][extname]'
      }
    },
    copyPublicDir: true
  },
  optimizeDeps: {
    include: ['vuetify', 'vue'],
    exclude: [],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    sourcemapIgnoreList: false,
    fs: {
      strict: false,
      allow: ['..', './**/node_modules/**']
    },
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost/api'),
    __DEV__: process.env.NODE_ENV !== 'production'
  },
  // Add experimental features for better module resolution
  experimental: {
    renderBuiltUrl(filename) {
      return filename
    }
  }
})

import path from 'node:path';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    jsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CRM Management System',
        short_name: 'CRM',
        description: 'Mobile CRM for field sales teams',
        theme_color: '#1976d2',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api-crm\.local\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 3600 }
            }
          },
          {
            urlPattern: /^https:\/\/api-auth\.local\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'auth-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 1800 }
            }
          }
        ]
      }
    }),
    {
      name: 'file-lowercase',
      transform(src, id) {
        if (id.startsWith('public/')) {
          const newId = id.toLowerCase();
          if (newId !== id) {
            return `import '${newId}';`;
          }
        }
      }
    }
  ],
  server: {
    host: 'crm.local.com',
    port: 3000,
    strictPort: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/_wildcard.local.com-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/_wildcard.local.com.pem')),
    },
    open: true
  },
  preview: {
    port: 5168,
    open: true
  },
  build: {
    sourcemap: false,
    manifest: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    define: {
      __BUILD_DATE__: JSON.stringify(Date.now())
    }
  },
  base: '/',
  define: {
    global: 'window',
    'process.env': {}
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@presentation': path.resolve(__dirname, 'src/presentation'),
      '@application': path.resolve(__dirname, 'src/application'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@data': path.resolve(__dirname, 'src/data'),
      '~': path.resolve(__dirname, 'node_modules'),
      'src': path.resolve(__dirname, 'src')
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  }
});

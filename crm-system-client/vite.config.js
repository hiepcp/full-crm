import path from 'node:path';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// SSL cert paths
const certKeyPath = path.resolve(__dirname, 'certs/_wildcard.local.com-key.pem');
const certPath = path.resolve(__dirname, 'certs/_wildcard.local.com.pem');
const certsExist = fs.existsSync(certKeyPath) && fs.existsSync(certPath);

export default defineConfig({
  plugins: [
    react(),
    jsconfigPaths(),
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
    https: certsExist ? {
      key: fs.readFileSync(certKeyPath),
      cert: fs.readFileSync(certPath),
    } : false,
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

import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import fs from 'fs';

// Custom plugin to serve files from the /shared directory
function serveSharedMiddleware() {
  return {
    name: 'serve-shared-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/shared/')) {
          // Resolve the file path relative to the project root
          const filePath = resolve(__dirname, '..', req.url.slice(1));
          
          if (fs.existsSync(filePath)) {
            // Determine content type based on file extension
            let contentType = 'application/octet-stream';
            if (filePath.endsWith('.json')) contentType = 'application/json';
            if (filePath.endsWith('.css')) contentType = 'text/css';
            if (filePath.endsWith('.js')) contentType = 'application/javascript';

            res.setHeader('Content-Type', contentType);
            fs.createReadStream(filePath).pipe(res);
          } else {
            // If file doesn't exist, let Vite handle it (will result in a 404)
            next();
          }
        } else {
          // For any other request, pass it to the next middleware
          next();
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    viteCommonjs(),
    serveSharedMiddleware()
  ],
  resolve: {
    alias: {
      // Definiert den @shared-Alias, um saubere Importe aus dem /shared-Ordner zu ermöglichen.
      // Er verweist auf das übergeordnete Verzeichnis und dann in den 'shared'-Ordner.
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  server: {
    // Optional: Port für den Vite-Dev-Server festlegen
    port: 5173,
    // Stellt sicher, dass die App im Browser geöffnet wird, wenn `npm run dev` ausgeführt wird.
    open: '/core/login/index.html',
    // Proxy für API-Anfragen an das Backend
    proxy: {
      // Leitet alle Anfragen, die mit /api beginnen, an den Backend-Server weiter
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true, // Notwendig für virtuelle Hosts
      },
    },
    // Konfiguration für den File-Watcher
    watch: {
      // Ignoriert Änderungen an der custom-fields.json, um einen automatischen Reload zu verhindern.
      // Unser eigener Code kümmert sich um das Neuladen der Daten in der Komponente.
      ignored: ['**/shared/config/custom-fields.json'],
    },
    fs: {
      // Erlaubt dem Vite-Server den Zugriff auf Dateien außerhalb des Workspace-Roots.
      // Notwendig, damit wir auf /shared zugreifen können.
      allow: ['..']
    }
  },
  build: {
    rollupOptions: {
      input: {
        // Definiert die Einstiegspunkte für den Build-Prozess.
        // Wir müssen hier jede 'index.html' jedes Moduls hinzufügen, damit Vite sie korrekt verarbeitet.
        login: resolve(__dirname, 'core/login/index.html'),
        dashboard: resolve(__dirname, 'core/dashboard/index.html'),
        adminDashboard: resolve(__dirname, 'core/admin-dashboard/index.html'),
        zutaten: resolve(__dirname, 'modules/zutaten/index.html'),
        rezept: resolve(__dirname, 'modules/rezept/index.html'),
        einrichtung: resolve(__dirname, 'modules/einrichtung/index.html'),
        menueplan: resolve(__dirname, 'modules/menueplan/index.html'),
        menuePortal: resolve(__dirname, 'modules/menue-portal/index.html')
      }
    }
  }
}); 
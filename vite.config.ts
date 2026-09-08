import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const pwaShellPlugin = () => ({
  name: 'pwa-shell-cache',
  generateBundle(_: unknown, bundle: Record<string, { fileName: string }>) {
    const assets = ['./', './index.html', './manifest.json', './icon.png', ...Object.values(bundle)
      .map(({ fileName }) => `./${fileName}`)
      .filter((fileName) => !fileName.endsWith('.map'))];
    const source = `const CACHE='cosmetics-shell-v2';const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ns=>Promise.all(ns.filter(n=>n.startsWith('cosmetics-shell-')&&n!==CACHE).map(n=>caches.delete(n)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin)return;if(r.mode==='navigate'){e.respondWith(caches.match('./index.html').then(c=>c||fetch(r)));return}e.respondWith(caches.match(r).then(c=>c||fetch(r).then(x=>{if(x.ok)caches.open(CACHE).then(k=>k.put(r,x.clone()));return x})))})`;
    this.emitFile({ type: 'asset', fileName: 'sw.js', source });
  }
});

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), pwaShellPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

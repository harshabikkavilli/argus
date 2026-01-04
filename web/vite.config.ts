import react from '@vitejs/plugin-react';
import {resolve} from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
	plugins: [react()],
	root: resolve(__dirname),
	base: '/',
	css: {
		postcss: resolve(__dirname, 'postcss.config.cjs')
	},
	build: {
		outDir: resolve(__dirname, '../dist/web'),
		emptyOutDir: true,
		sourcemap: true
	},
	server: {
		port: 5173,
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				// Required for SSE to work properly
				configure: (proxy) => {
					proxy.on('proxyReq', (proxyReq, req) => {
						// Keep connection alive for SSE
						if (req.url?.includes('/events')) {
							proxyReq.setHeader('Connection', 'keep-alive');
							proxyReq.setHeader('Cache-Control', 'no-cache');
						}
					});
				}
			}
		}
	}
});

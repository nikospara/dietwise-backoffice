import { defineConfig } from 'vitest/config';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
	plugins: [react(), eslintPlugin()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	server: {
		port: 5174,
		strictPort: true,
	},
	test: {
		environment: 'jsdom',
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
		},
	},
});

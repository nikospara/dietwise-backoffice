import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * @see https://vitejs.dev/config/
 */
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const basePath = (env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');

	return {
		base: basePath,
		// The ESLint plugin leaves behind a worker thread that keeps the process alive, so it is
		// left out of test runs; `npm run lint` lints the whole project anyway.
		plugins: [react(), tailwindcss(), ...(mode === 'test' ? [] : [eslintPlugin()])],
		resolve: {
			alias: {
				'@': path.resolve(import.meta.dirname, './src'),
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
	};
});

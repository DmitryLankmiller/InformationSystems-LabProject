import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    return {
        plugins: [react()],
        base: env.VITE_APP_BASE || '/',
        server: {
            port: 5174,
            proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
        },
    };
});

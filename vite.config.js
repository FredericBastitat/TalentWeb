import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/TalentWeb/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        target: 'esnext',
    },
    server: {
        port: 3000,
    },
});
import { defineConfig } from 'vite';

export default defineConfig({
    base: '/TalentWeb/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },
    server: {
        port: 3000,
    },
});

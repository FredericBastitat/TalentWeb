import { defineConfig } from 'vite';

export default defineConfig({
    base: '/TalentWeb/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        target: 'esnext',  // ← přidej toto
    },
    server: {
        port: 3000,
    },
});
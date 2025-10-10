export default {
    root: 'src/',
    publicDir: '../assets/',
    base: './',
    build: {
        target: 'esnext', // Support top-level await
        outDir: '../dist'
    },
    server: {
        host: true, // Expose to network
        port: 5173  // Default Vite port
    }
}
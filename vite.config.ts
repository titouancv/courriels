import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        allowedHosts: [
            'e5c55025-fff1-471b-859f-b90c9d73e488-00-3g0rocqwgfh6c.worf.replit.dev',
        ],
    },
})

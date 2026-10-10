import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        // Strip console/debugger from the production bundle. The server-side
        // logging in api/send.js is unaffected — that is not bundled by Vite.
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // The old `firebase` rule was dead: Firebase was removed
                    // when the backend moved to Supabase, so it never matched.
                    if (
                        id.includes('node_modules/react-router') ||
                        id.includes('node_modules/react-dom') ||
                        id.includes('node_modules/react/')
                    ) {
                        return 'react-vendor';
                    }
                    // Supabase is only reached from the admin pages and from
                    // the form senders, both of which import it dynamically.
                    // Keeping it in its own chunk makes that visible in the
                    // build output.
                    if (id.includes('node_modules/@supabase')) return 'supabase';
                },
            },
        },
    },
    esbuild: {
        drop: ['console', 'debugger'],
    },
})

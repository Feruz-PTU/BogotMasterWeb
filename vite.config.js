import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    ssr: {
        // react-helmet-async ships CommonJS. Left external, the prerender step
        // imports the SSR bundle as ESM and Node cannot see its named exports
        // ("does not provide an export named 'Helmet'"). Bundling it resolves
        // the named exports at build time instead.
        noExternal: ['react-helmet-async'],
    },
    build: {
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
    // NOTE: Vite 8 transforms with oxc, not esbuild, so an `esbuild: { drop }`
    // block here is silently ignored (it prints a warning and does nothing).
    // Stripping console statements is deferred rather than faked — see
    // "NeededManual changes.txt", section F.
})

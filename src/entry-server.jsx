import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';

/**
 * Render one URL to an HTML string at build time.
 *
 * MemoryRouter (rather than StaticRouter) is used deliberately: it is exported
 * from react-router-dom in every version, takes the URL as an initial entry,
 * and behaves identically for a single synchronous render.
 *
 * Returns the markup plus the collected <head> tags, which the prerender
 * script injects into the HTML template.
 */
export function render(url) {
    const helmetContext = {};

    const html = renderToString(
        <HelmetProvider context={helmetContext}>
            <MemoryRouter initialEntries={[url]}>
                <App />
            </MemoryRouter>
        </HelmetProvider>
    );

    const { helmet } = helmetContext;

    return {
        html,
        htmlAttributes: helmet?.htmlAttributes?.toString() || 'lang="en"',
        head: [
            helmet?.title?.toString(),
            helmet?.meta?.toString(),
            helmet?.link?.toString(),
            helmet?.script?.toString(),
        ]
            .filter(Boolean)
            .join('\n    '),
    };
}

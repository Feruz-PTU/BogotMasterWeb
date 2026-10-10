import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './index.css';

/**
 * Browser entry.
 *
 * Every public page now ships as real, prerendered HTML, so the browser
 * HYDRATES that markup instead of throwing it away and rendering from
 * scratch. That is what keeps the text on screen with no flash.
 *
 * The admin pages are not prerendered (they are private and must never be
 * indexed), so there is nothing to hydrate there and we mount normally.
 */
const container = document.getElementById('root');

const tree = (
    <React.StrictMode>
        <HelmetProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </HelmetProvider>
    </React.StrictMode>
);

const isPrerendered = container.hasAttribute('data-prerendered');

if (isPrerendered) {
    ReactDOM.hydrateRoot(container, tree);
} else {
    ReactDOM.createRoot(container).render(tree);
}

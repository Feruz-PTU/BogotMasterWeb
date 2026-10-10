import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import ScrollToTop from './components/ScrollToTop';
import { ToastContainer, useToast } from './components/Toast';
import { LanguageProvider } from './context/LanguageContext';
import { ContentProvider } from './context/ContentContext';
import { QuoteProvider } from './context/QuoteContext';
import {
    LIVE_LANGUAGES,
    DEFAULT_LANGUAGE,
    parsePathname,
} from './i18n/languages';

// Public pages are imported eagerly. They must render synchronously so the
// build can turn each one into real HTML; a lazy chunk would prerender as an
// empty Suspense fallback, which is the problem this whole change exists to
// fix. Only the admin bundle stays lazy — it is by far the largest and is
// never prerendered.
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFound from './pages/NotFound';

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

/** The five public routes, defined once and mounted under every language. */
function publicRoutes(addToast) {
    return [
        { path: '', element: <Home addToast={addToast} /> },
        { path: 'products', element: <Products addToast={addToast} /> },
        { path: 'products/:slug', element: <ProductDetail addToast={addToast} /> },
        { path: 'about', element: <AboutPage addToast={addToast} /> },
        { path: 'contact', element: <ContactPage addToast={addToast} /> },
        { path: 'privacy', element: <PrivacyPage /> },
    ];
}

function App() {
    const { toasts, addToast, removeToast } = useToast();
    const { pathname } = useLocation();

    // `null` means the first path segment looks like a language but is not a
    // live one (/uz/, /de/, /en/…). We must render a 404 and never fall back
    // to English or Russian content at that URL.
    const parsed = parsePathname(pathname);
    const language = parsed?.lang ?? DEFAULT_LANGUAGE;
    const isUnknownLanguage = parsed === null && !pathname.startsWith('/admin');

    const routes = publicRoutes(addToast);

    return (
        <LanguageProvider language={language}>
            <ContentProvider>
                <QuoteProvider>
                    <ScrollToTop />
                    {isUnknownLanguage ? (
                        <NotFound />
                    ) : (
                        <Routes>
                            {/* Default language lives on the bare URLs. */}
                            {routes.map((r) => (
                                <Route
                                    key={`default-${r.path}`}
                                    path={`/${r.path}`}
                                    element={r.element}
                                />
                            ))}

                            {/* Every other live language gets its own prefix. */}
                            {LIVE_LANGUAGES.filter(
                                (l) => l.code !== DEFAULT_LANGUAGE
                            ).flatMap((l) =>
                                routes.map((r) => (
                                    <Route
                                        key={`${l.code}-${r.path}`}
                                        path={`/${l.code}${r.path ? `/${r.path}` : ''}`}
                                        element={r.element}
                                    />
                                ))
                            )}

                            {/* Admin is client-only: not prerendered, noindexed
                                by an X-Robots-Tag header in vercel.json. */}
                            <Route
                                path="/admin/login"
                                element={
                                    <Suspense fallback={null}>
                                        <AdminLogin />
                                    </Suspense>
                                }
                            />
                            <Route
                                path="/admin"
                                element={
                                    <Suspense fallback={null}>
                                        <AdminDashboard />
                                    </Suspense>
                                }
                            />
                            <Route
                                path="/admin/products/:productSlug"
                                element={
                                    <Suspense fallback={null}>
                                        <AdminDashboard />
                                    </Suspense>
                                }
                            />
                            <Route
                                path="/admin/:tab"
                                element={
                                    <Suspense fallback={null}>
                                        <AdminDashboard />
                                    </Suspense>
                                }
                            />

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    )}
                    <ToastContainer toasts={toasts} removeToast={removeToast} />
                </QuoteProvider>
            </ContentProvider>
        </LanguageProvider>
    );
}

export default App;

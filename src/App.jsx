import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ScrollToTop from './components/ScrollToTop';
import { ToastContainer, useToast } from './components/Toast';

import Home from './pages/Home';

const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function App() {
    const { toasts, addToast, removeToast } = useToast();

    return (
        <>
            <ScrollToTop />
            <Suspense fallback={null}>
                <Routes>
                    <Route path="/" element={<Home addToast={addToast} />} />
                    <Route path="/products" element={<Products addToast={addToast} />} />
                    <Route path="/products/:slug" element={<ProductDetail addToast={addToast} />} />
                    <Route path="/about" element={<AboutPage addToast={addToast} />} />
                    <Route path="/contact" element={<ContactPage addToast={addToast} />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/products/new" element={<AdminDashboard />} />
                    <Route path="/admin/products/:productSlug" element={<AdminDashboard />} />
                    <Route path="/admin/:tab" element={<AdminDashboard />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}

export default App;

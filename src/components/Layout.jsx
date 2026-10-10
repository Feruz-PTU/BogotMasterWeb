import Navbar from './Navbar';
import Footer from './Footer';
import FloatingContact from './FloatingContact';
import QuoteCart from './QuoteCart';
import { useLanguage } from '../context/LanguageContext';

export default function Layout({ children }) {
    const { t } = useLanguage();

    return (
        <>
            {/* First focusable element on the page. */}
            <a className="skip-link" href="#main">
                {t('skip_to_content')}
            </a>
            <Navbar />
            {/* tabIndex -1 makes <main> a focus target for the skip link and
                for the route-change focus move in ScrollToTop. */}
            <main id="main" tabIndex={-1}>
                {children}
            </main>
            <Footer />
            <FloatingContact />
            <QuoteCart />
        </>
    );
}

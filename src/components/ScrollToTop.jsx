import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        if (pathname.startsWith('/admin')) return;
        window.scrollTo(0, 0);
        import('../supabase/data')
            .then(({ trackPageView }) => trackPageView(pathname))
            .catch(() => {});
    }, [pathname]);
    return null;
}

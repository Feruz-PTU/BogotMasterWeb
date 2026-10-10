import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { track, EVENTS } from '../analytics';

/**
 * Handles everything that must happen when the route changes.
 *
 * Besides scrolling, this now moves keyboard focus to <main> and announces
 * the new page. In a single-page app the browser does not do either: a
 * screen-reader user clicking "Products" previously heard nothing at all and
 * was left reading the old page, and keyboard focus was silently dropped to
 * the body.
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();
    const isFirstRender = useRef(true);
    const liveRef = useRef(null);

    useEffect(() => {
        if (pathname.startsWith('/admin')) return;

        // Don't steal focus on the very first load — the visitor has not
        // navigated yet, and moving focus would skip the skip-link.
        if (isFirstRender.current) {
            isFirstRender.current = false;
            track(EVENTS.PAGE_VIEW);
            return;
        }

        window.scrollTo(0, 0);

        const main = document.getElementById('main');
        if (main) main.focus({ preventScroll: true });

        // Announce the new page title to assistive technology. Helmet has
        // already updated document.title by this point.
        if (liveRef.current) {
            liveRef.current.textContent = document.title;
        }

        track(EVENTS.PAGE_VIEW);
    }, [pathname]);

    return (
        <div
            ref={liveRef}
            className="sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
        />
    );
}

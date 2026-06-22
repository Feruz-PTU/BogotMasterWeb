import { useEffect } from 'react';

/**
 * Adds the `active` class to `.reveal` elements as they scroll into view.
 * Uses IntersectionObserver (no per-scroll layout reads) and a MutationObserver
 * so elements rendered later (e.g. async Firestore content) are picked up too.
 */
export const useReveal = () => {
    useEffect(() => {
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        io.unobserve(entry.target);
                    }
                }
            },
            { rootMargin: '0px 0px -120px 0px', threshold: 0.05 }
        );

        const observeAll = (root) => {
            if (root.nodeType !== 1) return;
            if (root.classList?.contains('reveal')) io.observe(root);
            root.querySelectorAll?.('.reveal:not(.active)').forEach((el) => io.observe(el));
        };

        observeAll(document.body);

        // Pick up `.reveal` nodes added after the initial render.
        const mo = new MutationObserver((mutations) => {
            for (const m of mutations) {
                m.addedNodes.forEach((node) => observeAll(node));
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });

        return () => {
            io.disconnect();
            mo.disconnect();
        };
    }, []);
};

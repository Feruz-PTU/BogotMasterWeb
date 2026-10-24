import { useEffect, useId, useRef } from 'react';
import RequestForm from './RequestForm';
import { useLanguage } from '../context/LanguageContext';
import './RequestModal.css';

/**
 * The request form in a pop-up (see context/RequestContext.jsx, which owns it).
 * Closing only hides it, so reopening the same request keeps what was typed.
 * Escape and the backdrop close it; focus returns to the button that opened it.
 */
const RequestModal = ({ request, open, onClose, onSent }) => {
    const { t } = useLanguage();
    const titleId = useId();
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const returnTo = document.activeElement;
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKey);
            if (returnTo && typeof returnTo.focus === 'function') returnTo.focus();
        };
    }, [open, onClose]);

    if (!request) return null;

    return (
        <div className="rm-overlay" hidden={!open} onClick={onClose}>
            <div
                className="rm-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                ref={dialogRef}
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className="rm-close" onClick={onClose} aria-label={t('a11y_close')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 id={titleId} className="rm-title">{t('request_h1')}</h2>
                <RequestForm
                    key={request.id}
                    initialType={request.type}
                    initialProducts={request.products}
                    initialMessage={request.message}
                    onLinkClick={onClose}
                    onSent={onSent}
                />
            </div>
        </div>
    );
};

export default RequestModal;

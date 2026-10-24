import './QuoteButton.css';
import { useQuote } from '../context/QuoteContext';
import { useLanguage } from '../context/LanguageContext';
import { useAddToast } from './Toast';
import { track, EVENTS } from '../analytics';

const QuoteButton = ({ product, variant = '' }) => {
    const { has, toggleItem } = useQuote();
    const { t } = useLanguage();
    const addToast = useAddToast();
    const active = has(product.slug);

    const handleClick = () => {
        if (!active) {
            track(EVENTS.QUOTE_ADD); // adding only, not removing
            // Say so: the list itself is out of sight, behind the floating button.
            addToast(t('quote_added_toast').replace('{product}', product.title), 'success', 2500);
        }
        toggleItem({ slug: product.slug, title: product.title, image: product.image });
    };

    return (
        <button
            type="button"
            className={`quote-btn ${active ? 'active' : ''} ${variant}`}
            onClick={handleClick}
            aria-pressed={active}
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {active ? (
                    <path d="M20 6L9 17l-5-5" />
                ) : (
                    <>
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                    </>
                )}
            </svg>
            <span>{active ? t('quote_added') : t('quote_add')}</span>
        </button>
    );
};

export default QuoteButton;

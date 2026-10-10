import './Partners.css';
import { useLanguage } from '../context/LanguageContext';

/**
 * Partner logos.
 *
 * The company names below were read from the logo images themselves, so the
 * alt text names the actual partner instead of "Partner logo 1". That is
 * both better for a screen-reader user and better for search: a logo with no
 * name attached communicates nothing to either.
 *
 * `partner3` (Yuma Bio) has no text element in the SVG — the name is drawn as
 * vector paths — so it was read from the letterforms. Please confirm the
 * spelling; see "NeededManual changes.txt", section D.
 */
const PARTNERS = [
    { id: 1, image: '/partner/partner1.png', name: 'Licorice Extract' },
    { id: 2, image: '/partner/partner2.png', name: 'Farm Sanoat' },
    { id: 3, image: '/partner/partner3.svg', name: 'Yuma Bio' },
];

const Partners = () => {
    const { t } = useLanguage();

    return (
        <section className="partners-section">
            <div className="section-header">
                <span className="section-label">{t('partners_label')}</span>
                <h2 className="section-title">{t('partners_title')}</h2>
            </div>
            <div className="partners-grid">
                {PARTNERS.map((partner) => (
                    <div key={partner.id} className="partner-logo">
                        <img
                            src={partner.image}
                            alt={partner.name}
                            width="200"
                            height="60"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Partners;

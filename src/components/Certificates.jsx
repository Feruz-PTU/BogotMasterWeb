import './Certificates.css';
import { useLanguage } from '../context/LanguageContext';
import { track, EVENTS } from '../analytics';
import { CONTACT_INFO } from '../config';

// The company's registration documents, under English file names (folder 26).
// The same files under their old Russian names stay in public/Certificate/,
// so links shared before still work. The registry extract (cert_1) was
// removed on purpose: it exposed the director's personal ID number and the
// founders' ownership shares.
const DOCUMENTS = [
    // Unified State Register of Business Entities: entry of 12 Sep 2014. A scan, in Uzbek only.
    { id: 3, titleKey: 'cert_3', file: '/Certificate/state-registration-certificate.pdf', year: 2014, langKey: 'doc_lang_uz' },
    // Tax Committee: registered and INN assigned on 12 Sep 2014 (printed 24 Jan 2026). Uzbek and Russian.
    { id: 4, titleKey: 'cert_4', file: '/Certificate/tax-registration-certificate.pdf', year: 2014, langKey: 'doc_lang_uz_ru' },
    // Tax Committee: VAT payer from 1 Jan 2020 (registered 12 Feb 2020). Uzbek and Russian.
    { id: 2, titleKey: 'cert_2', file: '/Certificate/vat-registration-certificate.pdf', year: 2020, langKey: 'doc_lang_uz_ru' },
];

/** `withLegal` adds the legal name and INN under the documents (the About page). */
const Certificates = ({ withLegal = false }) => {
    const { t } = useLanguage();

    return (
        <section className="certificates-section">
            <div className="section-header">
                <span className="section-label">{t('documentation_label')}</span>
                <h2 className="section-title">{t('company_docs_title')}</h2>
            </div>

            <div className="certificates-wrapper">
                <div className="certificates-container">
                    <div className="certificates-grid">
                        {DOCUMENTS.map((cert) => (
                            <a
                                key={cert.id}
                                href={cert.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="certificate-item"
                                onClick={() => track(EVENTS.CLICK_CERTIFICATE)}
                            >
                                <div className="cert-icon-box">
                                    {/* Download Icon SVG */}
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                </div>
                                <p className="cert-title">{t(cert.titleKey)}</p>
                                <p className="cert-meta">{cert.year} · {t(cert.langKey)}</p>
                                <span className="sr-only">{t('a11y_new_tab')}</span>
                            </a>
                        ))}
                    </div>
                    <p className="certificates-note">{t('company_docs_note')}</p>
                    {withLegal && (
                        <p className="certificates-legal">
                            <span>{t('legal_name_label')}: {CONTACT_INFO.legal_name} ({t('legal_form_note')})</span>{' '}
                            <span>{t('inn_label')}: {CONTACT_INFO.inn_display}</span>
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Certificates;

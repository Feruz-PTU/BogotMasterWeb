import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { CONTACT_INFO } from '../config';
import './PrivacyPage.css';

/**
 * Privacy policy.
 *
 * The wording lives in the translation table (Supabase → Translations), so it
 * can be corrected in the admin panel without a code change. It describes the
 * data flows this site actually has: the three forms, the Supabase database,
 * Resend for email, Vercel for hosting, Google Fonts, and the cookieless
 * page/event counter. No cookies are set for analytics, which is why there is
 * no cookie banner.
 *
 * DRAFT: reviewed by nobody with legal training. See "NeededManual changes.txt".
 */
const SECTIONS = [
    'privacy_what',
    'privacy_why',
    'privacy_where',
    'privacy_email',
    'privacy_analytics',
    'privacy_retention',
    'privacy_rights',
];

const PrivacyPage = () => {
    const { t } = useLanguage();

    return (
        <Layout>
            <SEO
                routePath="/privacy"
                title={t('privacy_meta_title')}
                description={t('privacy_meta_desc')}
            />
            <div className="privacy-page">
                <div className="privacy-inner">
                    <h1>{t('privacy_title')}</h1>

                    <p className="privacy-draft" role="note">
                        <strong>{t('privacy_draft_label')}</strong>{' '}
                        {t('privacy_draft_text')}
                    </p>

                    <p className="privacy-updated">{t('privacy_intro')}</p>

                    {SECTIONS.map((key) => (
                        <section key={key}>
                            <h2>{t(`${key}_title`)}</h2>
                            <p>{t(`${key}_text`)}</p>
                        </section>
                    ))}

                    <section>
                        <h2>{t('privacy_contact_title')}</h2>
                        <p>
                            {t('privacy_contact_text')}{' '}
                            <a href={`mailto:${CONTACT_INFO.email}`}>
                                {CONTACT_INFO.email}
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </Layout>
    );
};

export default PrivacyPage;

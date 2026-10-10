import Layout from '../components/Layout';
import SEO from '../components/SEO';
import LocalLink from '../components/LocalLink';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
    const { t } = useLanguage();
    return (
        <Layout>
            <SEO
                routePath="/404"
                title={t('notfound_title')}
                description={t('notfound_text')}
                noindex
            />
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '120px 5% 80px',
                gap: '16px',
            }}>
                {/* The h1 used to be the literal string "404", which is not a
                    description of the page. The number is now decorative and
                    the real heading carries the meaning. */}
                <p aria-hidden="true" style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1, margin: 0 }}>404</p>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1A1A1A' }}>{t('notfound_heading')}</h1>
                <p style={{ color: '#5A5A5A', maxWidth: '480px' }}>{t('notfound_text')}</p>
                <LocalLink to="/" className="btn-primary" style={{ marginTop: '12px' }}>
                    {t('notfound_home')}
                </LocalLink>
            </div>
        </Layout>
    );
};

export default NotFound;

import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
    const { t } = useLanguage();
    return (
        <Layout>
            <SEO title={t('notfound_title')} noindex />
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
                <h1 style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>404</h1>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1A1A1A' }}>{t('notfound_heading')}</h2>
                <p style={{ color: '#666', maxWidth: '480px' }}>{t('notfound_text')}</p>
                <Link to="/" className="btn-primary" style={{ marginTop: '12px' }}>
                    {t('notfound_home')}
                </Link>
            </div>
        </Layout>
    );
};

export default NotFound;

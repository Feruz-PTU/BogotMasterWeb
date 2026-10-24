import Layout from '../components/Layout';
import SEO from '../components/SEO';
import Contact from '../components/Contact';
import { useReveal } from '../hooks/useReveal';
import { useLanguage } from '../context/LanguageContext';
import { useRequest } from '../context/RequestContext';

const ContactPage = () => {
    useReveal();
    const { t } = useLanguage();
    const { openRequest } = useRequest();

    return (
        <Layout>
            {/* Was a bare <SEO />, so /contact shipped the homepage's title and
                meta description while the purpose-written contact_meta_*
                strings sat unused in the database. */}
            <SEO
                kind="contact"
                routePath="/contact"
                title={t('contact_meta_title')}
                description={t('contact_meta_desc')}
            />
            <div style={{ paddingTop: '90px' }}>
                {/* The "Write to us" banner asks a general question. */}
                <Contact openPopup={() => openRequest({ type: 'other' })} />
            </div>
        </Layout>
    );
};

export default ContactPage;

import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import Contact from '../components/Contact';
import PriceModal from '../components/PriceModal';
import { useReveal } from '../hooks/useReveal';
import { useLanguage } from '../context/LanguageContext';

const ContactPage = ({ addToast }) => {
    useReveal();
    const { t } = useLanguage();
    const [isPopupOpen, setIsPopupOpen] = useState(false);

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
                <Contact addToast={addToast} openPopup={() => setIsPopupOpen(true)} />
            </div>

            {/* Rendered outside the .reveal transform context so position:fixed works correctly.
                A general question, so no quantity is required. */}
            <PriceModal
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                productTitle={t('modal_info_title')}
                requireQuantity={false}
                addToast={addToast}
            />
        </Layout>
    );
};

export default ContactPage;

import React, { useState } from 'react';
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
            <SEO />
            <div style={{ paddingTop: '90px' }}>
                <Contact addToast={addToast} openPopup={() => setIsPopupOpen(true)} />
            </div>

            {/* Rendered outside the .reveal transform context so position:fixed works correctly */}
            <PriceModal
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                productTitle={t('modal_info_title')}
                addToast={addToast}
            />
        </Layout>
    );
};

export default ContactPage;

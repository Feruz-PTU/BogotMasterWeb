import { Link } from 'react-router-dom';
import './HomeCTA.css';
import { useLanguage } from '../context/LanguageContext';

const HomeCTA = () => {
    const { t, language } = useLanguage();

    return (
        <section className="home-cta-section">
            <div className="home-cta-container">
                <div className="home-cta-content">
                    <h2>{language === 'ru' ? 'Готовы начать сотрудничество?' : 'Ready to Partner with Us?'}</h2>
                    <p>
                        {language === 'ru' 
                            ? 'Свяжитесь с нами сегодня, чтобы получить индивидуальное коммерческое предложение.' 
                            : 'Contact us today to receive a personalized commercial proposal.'}
                    </p>
                    <div className="home-cta-btns">
                        <Link to="/contact" className="btn-primary">
                            {t('contactBtn')}
                        </Link>
                        <Link to="/about" className="btn-secondary-outline">
                            {t('read_more')}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeCTA;

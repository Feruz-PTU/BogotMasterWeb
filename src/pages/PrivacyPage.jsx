import Layout from '../components/Layout';
import SEO from '../components/SEO';
import Markdown from '../components/Markdown';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_LANGUAGE } from '../i18n/languages';
import policyEn from '../content/privacy-policy.en.md?raw';
import policyRu from '../content/privacy-policy.ru.md?raw';
import './PrivacyPage.css';

/**
 * Privacy policy.
 *
 * The text lives in src/content/privacy-policy.<language>.md, one file per
 * live language. It used to be seven one-paragraph strings in the translation
 * table; the full policy has tables, lists and sub-sections, which that table
 * cannot hold. The page title and the meta tags still come from translations.
 *
 * The wording is the version written by the company's lawyer (a Word document
 * in English, effective 12 October 2026); the Russian file is a translation
 * of it. It is legal text: do not reword it without the lawyer, and make
 * every change in BOTH language files, including the two dates at the top.
 *
 * A language added in src/i18n/languages.js needs its own file here; until it
 * has one, that language shows the default-language text.
 */
const POLICY = {
    en: policyEn,
    ru: policyRu,
};

const PrivacyPage = () => {
    const { t, language } = useLanguage();

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
                    <Markdown source={POLICY[language] ?? POLICY[DEFAULT_LANGUAGE]} />
                </div>
            </div>
        </Layout>
    );
};

export default PrivacyPage;

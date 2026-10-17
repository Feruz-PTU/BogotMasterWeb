import { useLanguage } from '../context/LanguageContext';
import { InlineMarkdown } from './Markdown';
import './PlantPhoto.css';

/**
 * Photo of a flowering Glycyrrhiza glabra, used on the home page and the
 * articles page.
 *
 * It is a Wikimedia Commons photo under CC BY-SA, which requires the author,
 * the source and the licence to be credited wherever it is shown. It was taken
 * on the Kuban River in Russia, not in Khorezm, so it must not be captioned as
 * our own field or region. public/images/ holds a resized WebP of the
 * original; the picture itself is not cropped or altered.
 */
const SOURCE_URL = 'https://commons.wikimedia.org/wiki/File:Glycyrrhiza_glabra_Y03.jpg';
const LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

const PlantPhoto = ({ className = '', loading = 'lazy' }) => {
    const { t } = useLanguage();

    return (
        <figure className={`plant-photo ${className}`.trim()}>
            <img
                src="/images/Glycyrrhiza_glabra_Y03.webp"
                alt={t('plant_photo_alt')}
                width="640"
                height="853"
                loading={loading}
                decoding="async"
            />
            <figcaption>
                <InlineMarkdown text={t('plant_photo_caption')} />
                <span className="plant-photo-credit">
                    {t('plant_photo_credit')},{' '}
                    <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>,{' '}
                    <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>
                </span>
            </figcaption>
        </figure>
    );
};

export default PlantPhoto;

import MediaImage from './MediaImage';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { formatDate } from '../utils/dates';
import './PagePhotos.css';

/**
 * A row of gallery photos inside a content page's text (content/pages/photos.js),
 * each with its admin caption and, if known, the date it was taken. A photo
 * no longer in the gallery is left out, so the page never shows a photo that
 * has no caption or site copy.
 */
const PagePhotos = ({ photos }) => {
    const { t, language } = useLanguage();
    const { gallery, rawSettings } = useContent();
    const captions = rawSettings?.gallery_captions || {};
    const shown = photos.filter((p) => (gallery || []).includes(p.src));
    if (!shown.length) return null;

    return (
        <div className={`page-photos page-photos-${shown.length > 1 ? 'two' : 'one'}`}>
            {shown.map(({ src, date }) => {
                const caption = captions[src]?.[language] || '';
                return (
                    <figure key={src} className="page-photo">
                        <MediaImage
                            src={src}
                            alt={caption || t('gallery_item_alt')}
                            sizes={shown.length > 1 ? '(max-width: 640px) 92vw, 360px' : '(max-width: 760px) 92vw, 720px'}
                            loading="lazy"
                            decoding="async"
                        />
                        {(caption || date) && (
                            <figcaption>
                                {caption}
                                {caption && date ? ' · ' : ''}
                                {date && <time dateTime={date}>{formatDate(date, language)}</time>}
                            </figcaption>
                        )}
                    </figure>
                );
            })}
        </div>
    );
};

export default PagePhotos;

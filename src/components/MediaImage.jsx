import { useContent } from '../context/ContentContext';

/**
 * A photo the database points at (a product or gallery photo), shown from the
 * site's own copies when the build made them (scripts/build-media.mjs): from
 * the page's own address, so the browser opens no second connection, and in
 * several widths, so it downloads the smallest that is sharp at `sizes` (how
 * wide the photo is shown). `src` is always the original address, which is
 * how the copies are looked up. Without copies (a photo the build could not
 * download) it is the original file, as before.
 *
 * `largest` shows the biggest copy and no srcset (the gallery's full view).
 *
 * srcSet and sizes come before src, and loading before both: set in the other
 * order on a new element, some browsers start downloading src first.
 */
const MediaImage = ({ src, sizes, width, height, alt = '', largest = false, ...rest }) => {
    const { media } = useContent();
    const copy = media?.[src];
    if (!copy) {
        return <img {...rest} alt={alt} width={width} height={height} src={src} />;
    }
    return (
        <img
            {...rest}
            alt={alt}
            width={copy.w}
            height={copy.h}
            sizes={largest ? undefined : sizes}
            srcSet={largest ? undefined : copy.srcset}
            src={copy.src}
        />
    );
};

export default MediaImage;

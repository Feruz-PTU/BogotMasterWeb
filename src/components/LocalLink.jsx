import { Link, NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { localizedPath } from '../i18n/languages';

/**
 * A <Link> that stays inside the current language.
 *
 * Write the language-independent path and this adds the prefix:
 *   <LocalLink to="/products">  ->  /products      (English)
 *                               ->  /ru/products   (Russian)
 *
 * Using this everywhere is what keeps the two language trees separate, so a
 * Russian visitor never silently lands on an English page (and vice versa),
 * and crawlers can walk each language on its own.
 */
export const useLocalPath = () => {
    const { language } = useLanguage();
    return (to) => localizedPath(language, to);
};

const LocalLink = ({ to, children, ...rest }) => {
    const localPath = useLocalPath();
    return (
        <Link to={localPath(to)} {...rest}>
            {children}
        </Link>
    );
};

export const LocalNavLink = ({ to, children, ...rest }) => {
    const localPath = useLocalPath();
    return (
        <NavLink to={localPath(to)} end={to === '/'} {...rest}>
            {children}
        </NavLink>
    );
};

export default LocalLink;

import { routeInLanguage as articleRouteInLanguage } from './articles';
import { pageRouteInLanguage } from './pages';

/**
 * Where the language switcher sends a reader of `routePath` who picks
 * language `code`: the same page when it exists in that language. An article
 * without that language goes to the article list; a content page without it
 * goes to its nearest ancestor in that language, else the home page.
 */
export const routeInLanguage = (routePath, code) =>
    pageRouteInLanguage(articleRouteInLanguage(routePath, code), code);

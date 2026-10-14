/**
 * "2026-10-14" -> "14 October 2026" / "14 октября 2026".
 *
 * Spelled out by hand rather than with Intl.DateTimeFormat: the page is
 * rendered once in Node at build time and again in the browser, and the two
 * ICU libraries do not always agree on the details ("2026 г." or "2026"), which
 * would make React's hydration see different text.
 */
const MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'],
    ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
        'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};

export function formatDate(isoDate, language) {
    const [year, month, day] = isoDate.split('-').map(Number);
    const names = MONTHS[language] || MONTHS.en;
    return `${day} ${names[month - 1]} ${year}`;
}

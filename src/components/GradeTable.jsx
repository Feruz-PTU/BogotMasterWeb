import LocalLink from './LocalLink';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { gradeRows, rangeText } from '../utils/productGrades';
import './GradeTable.css';

/**
 * Grades by root diameter, built from the product data (utils/productGrades.js;
 * folder 28): grade, diameter, the products in that grade.
 * - /products: one form under its group (`form="slices"`).
 * - A slice or tablet page: its form, with that product's row marked
 *   (`current` is its slug).
 * - The buyer's guide chapter: slices and tablets together
 *   (`forms={['slices', 'tablets']}`), under the chapter's own heading
 *   (`title={false}`) and without the link to the chapter itself
 *   (`guideLink={false}`).
 * Renders nothing if no product of the form(s) has a grade.
 */
const GradeTable = ({ form, forms = [form], current, title = true, guideLink = true, className = '' }) => {
    const { t } = useLanguage();
    const { products } = useContent();
    const rows = gradeRows(products, forms);
    if (!rows.length) return null;
    const key = forms.length === 1 ? forms[0] : 'all';
    const titleId = `grades-${key}${current ? '-here' : ''}`;

    return (
        <section
            className={`grade-table ${className}`.trim()}
            {...(title ? { 'aria-labelledby': titleId } : { 'aria-label': t(`grades_title_${key}`) })}
        >
            {title && <h3 id={titleId} className="grade-table-title">{t(`grades_title_${key}`)}</h3>}
            <table>
                <thead>
                    <tr>
                        <th scope="col">{t('grades_col_grade')}</th>
                        <th scope="col">{t('grades_col_diameter')}</th>
                        <th scope="col">{t('grades_col_product')}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const list = forms.flatMap((f) => row.products[f] || []);
                        const here = list.some((p) => p.slug === current);
                        return (
                            <tr key={row.code} className={here ? 'is-current' : undefined}>
                                <th scope="row">{row.code}</th>
                                <td>{rangeText(row, t)}</td>
                                <td>
                                    {list.map((p, i) => (
                                        <span key={p.slug}>
                                            {i > 0 && ', '}
                                            {p.slug === current ? (
                                                <span aria-current="page">
                                                    {p.title} <span className="grade-table-here">({t('grades_this')})</span>
                                                </span>
                                            ) : (
                                                <LocalLink to={`/products/${p.slug}`}>{p.title}</LocalLink>
                                            )}
                                        </span>
                                    ))}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <p className="grade-table-note">
                {t(`grades_note_${key}`)}
                {guideLink && (
                    <>
                        {' '}
                        <LocalLink to="/buyers-guide/choosing-a-grade">{t('grades_guide_link')}</LocalLink>
                    </>
                )}
            </p>
        </section>
    );
};

export default GradeTable;

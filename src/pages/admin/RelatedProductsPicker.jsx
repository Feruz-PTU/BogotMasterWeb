import { useEffect, useId, useMemo, useRef, useState } from 'react';
import './RelatedProductsPicker.css';

const nameOf = (p) => p.title_en || p.title_ru || p.slug;

// Matches .rpp-options max-height in the CSS.
const LIST_MAX_HEIGHT = 280;

// The visible area the dropdown has to fit in: the nearest ancestor that cuts
// off overflow (the product editor does), limited to the viewport.
const visibleArea = (el) => {
    let top = 0;
    let bottom = window.innerHeight;
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        if (getComputedStyle(n).overflowY !== 'visible') {
            const r = n.getBoundingClientRect();
            top = Math.max(top, r.top);
            bottom = Math.min(bottom, r.bottom);
            break;
        }
    }
    return { top, bottom };
};

/**
 * Edits the family of the product being edited (see utils/productFamily.js).
 *
 * `value` is the family in display order, with `null` standing for this
 * product (its slug may not exist yet while a new product is being added),
 * or [] when the product is in no family. `families` maps each slug to its
 * saved family, to flag products that would move here from another family.
 */
const RelatedProductsPicker = ({ value = [], onChange, products, families, currentSlug, selfName, selfImage }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const [active, setActive] = useState(0);
    const listId = useId();
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

    // Drop products deleted since the family was loaded; this product alone is no family.
    const kept = value.filter((s) => s === null || (s !== currentSlug && bySlug.has(s)));
    const rows = kept.some((s) => s !== null) ? kept : [];

    // The saved family a product belongs to, unless it is this product's own.
    const otherFamily = (slug) => {
        const family = families.get(slug);
        return family && !(currentSlug && family.includes(currentSlug)) ? family : null;
    };
    const familyNames = (family, slug) =>
        family.filter((s) => s !== slug).map((s) => (bySlug.get(s) ? nameOf(bySlug.get(s)) : s)).join(', ');

    const options = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products.filter(
            (p) =>
                p.slug !== currentSlug &&
                !value.includes(p.slug) &&
                (!q || [p.title_en, p.title_ru, p.slug].some((s) => s?.toLowerCase().includes(q)))
        );
    }, [products, value, currentSlug, query]);

    const activeIndex = Math.min(active, options.length - 1);
    const activeOption = open && activeIndex >= 0 ? options[activeIndex] : null;
    const optionId = (slug) => `${listId}-${slug}`;

    useEffect(() => {
        if (!open || activeIndex < 0) return;
        listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }, [open, activeIndex]);

    const openList = () => {
        if (open) return;
        // Open upwards when the list would be cut off below and there is more room above.
        const rect = inputRef.current.getBoundingClientRect();
        const area = visibleArea(inputRef.current);
        const below = area.bottom - rect.bottom;
        setDropUp(below < LIST_MAX_HEIGHT && rect.top - area.top > below);
        setOpen(true);
    };

    // The first product added starts a family, with this product first.
    const add = (slug) => {
        onChange([...(rows.length > 0 ? rows : [null]), slug]);
        setQuery('');
    };

    // A family needs two products: removing the last other one ends it.
    const remove = (slug) => {
        const next = rows.filter((s) => s !== slug);
        onChange(next.some((s) => s !== null) ? next : []);
    };

    const move = (index, dir) => {
        const next = [...rows];
        const target = index + dir;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) openList();
            else setActive(Math.min(activeIndex + 1, options.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(Math.max(activeIndex - 1, 0));
        } else if (e.key === 'Enter') {
            // Never let Enter submit anything else on the page.
            e.preventDefault();
            if (activeOption) add(activeOption.slug);
        } else if (e.key === 'Escape' && open) {
            e.preventDefault();
            setOpen(false);
        }
    };

    const moveButtons = (i, label) => (
        <>
            <button type="button" className="admin-reorder-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Move up" aria-label={`Move ${label} up`}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
            </button>
            <button type="button" className="admin-reorder-btn" onClick={() => move(i, 1)} disabled={i === rows.length - 1} title="Move down" aria-label={`Move ${label} down`}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
        </>
    );

    return (
        <div className="rpp">
            <p className="rpp-hint">
                Products in one family show each other here, in this order. Changes apply to every
                product in the family, and a product is in one family at a time. Each page shows the
                other members, so a family of 4 fills one row on desktop.
            </p>

            <div className="rpp-combobox">
                <svg className="rpp-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-label="Add a product to this family"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeOption ? optionId(activeOption.slug) : undefined}
                    placeholder="Search products to add to the family…"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActive(0); openList(); }}
                    onFocus={openList}
                    onClick={openList}
                    onBlur={() => setOpen(false)}
                    onKeyDown={handleKeyDown}
                />
                {open && (
                    <ul className={`rpp-options ${dropUp ? 'is-up' : ''}`} id={listId} role="listbox" ref={listRef}>
                        {options.length === 0 ? (
                            <li className="rpp-empty" role="presentation">
                                {query.trim() ? 'No matching products.' : 'Every product is already in this family.'}
                            </li>
                        ) : (
                            options.map((p, i) => {
                                const other = otherFamily(p.slug);
                                return (
                                    <li
                                        key={p.slug}
                                        id={optionId(p.slug)}
                                        role="option"
                                        aria-selected={i === activeIndex}
                                        className={`rpp-option ${i === activeIndex ? 'is-active' : ''}`}
                                        // Keep focus in the input so the list stays open for the next pick.
                                        onMouseDown={(e) => e.preventDefault()}
                                        onMouseEnter={() => setActive(i)}
                                        onClick={() => add(p.slug)}
                                    >
                                        <img src={p.image} alt="" loading="lazy" />
                                        <span className="rpp-name">
                                            <strong>{nameOf(p)}</strong>
                                            <small>{p.slug}</small>
                                        </span>
                                        {other && (
                                            <span className="rpp-badge rpp-badge-family" title={`In a family with ${familyNames(other, p.slug)}. Adding it moves it here.`}>
                                                In another family
                                            </span>
                                        )}
                                        {p.hidden && <span className="rpp-badge">Hidden</span>}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                )}
            </div>

            {rows.length > 0 ? (
                <ol className="rpp-list">
                    {rows.map((s, i) => {
                        if (s === null) {
                            return (
                                <li key="self" className="rpp-item is-self">
                                    <span className="rpp-pos">{i + 1}</span>
                                    {selfImage ? <img src={selfImage} alt="" /> : <span className="rpp-thumb-empty" />}
                                    <span className="rpp-name">
                                        <strong>{selfName}</strong>
                                        <small>not shown on its own page</small>
                                    </span>
                                    <span className="rpp-badge rpp-badge-self">This product</span>
                                    <span className="rpp-actions">
                                        {moveButtons(i, 'this product')}
                                        <span className="rpp-remove-spacer" aria-hidden="true" />
                                    </span>
                                </li>
                            );
                        }
                        const p = bySlug.get(s);
                        const other = otherFamily(s);
                        return (
                            <li key={s} className={`rpp-item ${p.hidden ? 'is-hidden' : ''}`}>
                                <span className="rpp-pos">{i + 1}</span>
                                <img src={p.image} alt="" loading="lazy" />
                                <span className="rpp-name">
                                    <strong>{nameOf(p)}</strong>
                                    <small>{p.slug}</small>
                                </span>
                                {other && (
                                    <span className="rpp-badge rpp-badge-family" title={`Saving moves it out of its family with ${familyNames(other, s)}.`}>
                                        Moves from another family
                                    </span>
                                )}
                                {p.hidden && (
                                    <span className="rpp-badge" title="This product is hidden, so it will not appear on any page until you show it again.">
                                        Hidden — not shown
                                    </span>
                                )}
                                <span className="rpp-actions">
                                    {moveButtons(i, nameOf(p))}
                                    <button type="button" className="rpp-remove" onClick={() => remove(s)} title="Remove from family" aria-label={`Remove ${nameOf(p)} from the family`}>×</button>
                                </span>
                            </li>
                        );
                    })}
                </ol>
            ) : (
                <p className="rpp-auto">
                    Not in a family — the page shows the first 3 products automatically. Add a product
                    to start a family.
                </p>
            )}
        </div>
    );
};

export default RelatedProductsPicker;

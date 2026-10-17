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
 * Chooses the products listed under "Related products" on a product page.
 *
 * `value` is an ordered list of slugs, and the page shows them in that order.
 * An empty list means the page falls back to picking three products itself.
 * Slugs of products that no longer exist are skipped here; the dashboard
 * removes them from the data when the product is saved.
 */
const RelatedProductsPicker = ({ value = [], onChange, products, currentSlug }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const [active, setActive] = useState(0);
    const listId = useId();
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

    const selected = value
        .filter((s) => s !== currentSlug)
        .map((s) => bySlug.get(s))
        .filter(Boolean);

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

    const add = (slug) => {
        onChange([...value.filter((s) => s !== slug), slug]);
        setQuery('');
    };

    const remove = (slug) => onChange(value.filter((s) => s !== slug));

    const move = (index, dir) => {
        const slugs = selected.map((p) => p.slug);
        const target = index + dir;
        if (target < 0 || target >= slugs.length) return;
        [slugs[index], slugs[target]] = [slugs[target], slugs[index]];
        onChange(slugs);
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

    return (
        <div className="rpp">
            <p className="rpp-hint">
                Shown at the bottom of this product&apos;s page, in this order, in every language.
                Three fill one row on desktop. Leave empty to show the first 3 products of the
                catalogue automatically.
            </p>

            <div className="rpp-combobox">
                <svg className="rpp-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-label="Add a related product"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeOption ? optionId(activeOption.slug) : undefined}
                    placeholder="Search products to add…"
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
                                {query.trim() ? 'No matching products.' : 'Every product is already added.'}
                            </li>
                        ) : (
                            options.map((p, i) => (
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
                                    {p.hidden && <span className="rpp-badge">Hidden</span>}
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>

            {selected.length > 0 ? (
                <ol className="rpp-list">
                    {selected.map((p, i) => (
                        <li key={p.slug} className={`rpp-item ${p.hidden ? 'is-hidden' : ''}`}>
                            <span className="rpp-pos">{i + 1}</span>
                            <img src={p.image} alt="" loading="lazy" />
                            <span className="rpp-name">
                                <strong>{nameOf(p)}</strong>
                                <small>{p.slug}</small>
                            </span>
                            {p.hidden && (
                                <span className="rpp-badge" title="This product is hidden, so it will not appear on the page until you show it again.">
                                    Hidden — not shown
                                </span>
                            )}
                            <span className="rpp-actions">
                                <button type="button" className="admin-reorder-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Move up" aria-label={`Move ${nameOf(p)} up`}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                                </button>
                                <button type="button" className="admin-reorder-btn" onClick={() => move(i, 1)} disabled={i === selected.length - 1} title="Move down" aria-label={`Move ${nameOf(p)} down`}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                                </button>
                                <button type="button" className="rpp-remove" onClick={() => remove(p.slug)} title="Remove" aria-label={`Remove ${nameOf(p)}`}>×</button>
                            </span>
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="rpp-auto">No products picked — the page shows the first 3 automatically.</p>
            )}
        </div>
    );
};

export default RelatedProductsPicker;

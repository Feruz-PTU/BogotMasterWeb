import { useEffect, useState } from 'react';
import Markdown from './Markdown';

/** Texts already fetched in this visit, so going back to one is instant. */
const fetched = new Map();

/**
 * A long Markdown text that is not in the browser bundle: an article or a
 * content page.
 *
 * - `bodies`: the module that holds the texts (content/articles/bodies.js or
 *   content/pages/bodies.js), with bodyNow(name, language) and
 *   loadBody(name, language).
 * - `kind`, `name`, `language`: which text; "article" or "page", the slug or
 *   id, the language code.
 *
 * In the browser there are two cases:
 * - Opening the page's URL: it arrives prerendered with the whole text in it.
 *   While hydrating, React leaves the children of an element that has
 *   dangerouslySetInnerHTML untouched, so the empty value below keeps the
 *   server's text on screen and nothing is downloaded.
 * - Arriving from another page of the site: there is no server HTML to keep,
 *   so the text is fetched and rendered.
 *
 * Give it a `key` that changes with the text, so a new text never shows inside
 * the old component's state.
 *
 * `widgets`, optional: { name: element } for the text's {{name}} lines (the
 * buyer's guide puts the grade table, built from the product data, there).
 * They render in the prerender and in the browser alike.
 */
const MarkdownBody = ({ bodies, kind, name, language, className, loadingText, headingLinks, anchorLabel, widgets }) => {
    const bodyKey = `${kind}:${name}.${language}`;
    const [source, setSource] = useState(
        () => bodies.bodyNow(name, language) ?? fetched.get(bodyKey) ?? null
    );
    const [keepServerHtml] = useState(
        () =>
            source === null &&
            typeof document !== 'undefined' &&
            document.querySelector(`[data-md-body="${bodyKey}"]`) !== null
    );

    // Arriving from another page of the site with an anchor (a link to
    // /buyers-guide/samples-and-ordering#samples): the router has scrolled to
    // the top, so go to the heading once the text is on screen. Opening the
    // URL directly needs nothing: the browser finds the anchor in the HTML.
    useEffect(() => {
        if (source === null) return;
        let id = '';
        try {
            id = decodeURIComponent(window.location.hash.slice(1));
        } catch {
            return;
        }
        // Directly, not in requestAnimationFrame: the text is already in the
        // page, and a browser that draws no frames (headless) would never run it.
        const el = id && document.getElementById(id);
        if (el) el.scrollIntoView({ block: 'start' });
    }, [source]);

    useEffect(() => {
        if (source !== null || keepServerHtml) return undefined;
        let current = true;
        bodies.loadBody(name, language)?.then((text) => {
            fetched.set(bodyKey, text);
            if (current) setSource(text);
        });
        return () => {
            current = false;
        };
    }, [bodies, bodyKey, name, language, source, keepServerHtml]);

    if (keepServerHtml) {
        return (
            <div
                className={className}
                data-md-body={bodyKey}
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: '' }}
            />
        );
    }
    if (source === null) {
        return (
            <p className={`${className}-loading`} role="status">
                {loadingText}
            </p>
        );
    }
    return (
        <div className={className} data-md-body={bodyKey}>
            <Markdown source={source} headingLinks={headingLinks} anchorLabel={anchorLabel} widgets={widgets} />
        </div>
    );
};

export default MarkdownBody;

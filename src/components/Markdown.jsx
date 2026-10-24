import { CONTACT_INFO } from '../config';
import './Markdown.css';

/**
 * A deliberately small Markdown renderer for this site's own long-form text
 * (the privacy policy and the articles in src/content/).
 *
 * Why not a library: the public pages are imported eagerly so that they can be
 * prerendered (see App.jsx), which means anything pulled in here is downloaded
 * on every page. A full parser would weigh more than the text it renders, and
 * the texts need only a handful of constructs. This supports exactly:
 *
 *   ## and ### headings     paragraphs        - bullet lists
 *   1. numbered lists       | pipe | tables   **bold**  *italic*  `code`
 *   [text](url)             \[ and other backslash escapes
 *
 * Every heading gets an id, so a section can be linked to (/logistics#fca).
 * `## Heading {#fca}` sets it; otherwise it is made from the heading text.
 * Set it by hand where the English and Russian pages must share an anchor.
 *
 * Anything else comes out as plain text. The source is always a file from
 * this repository, never visitor input, and it is rendered as React elements
 * rather than injected as HTML.
 */

const HEADING = /^(#{2,3})\s+(.+)$/;
// An explicit anchor at the end of a heading: "## Free carrier {#fca}".
const ANCHOR = /\s*\{#([a-z0-9][a-z0-9-]*)\}\s*$/i;
const BULLET = /^-\s+(.+)$/;
const NUMBERED = /^\d+\.\s+(.+)$/;
// Bold is tried before italic, so ***x*.** reads as bold around an italic x
// (the articles write "***G. glabra*.**" for a bold species name).
const INLINE =
    /\*\*(.+?)\*\*|\*([^*\s](?:[^*]*?[^*\s])?)\*|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\\([\\`*_{}[\]()#+\-.!|>~])/g;

const isTableRow = (line) => line.startsWith('|');

const startsBlock = (line) =>
    HEADING.test(line) || BULLET.test(line) || NUMBERED.test(line) || isTableRow(line);

const splitRow = (line) =>
    line
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((cell) => cell.trim());

/** Links that leave the site open in a new tab; mailto: and our own do not. */
const isExternal = (href) =>
    /^https?:\/\//i.test(href) && !href.startsWith(CONTACT_INFO.website);

/** "Free carrier (FCA)" -> "free-carrier-fca"; Cyrillic letters are kept. */
const slugify = (text) =>
    plainText(text)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '') || 'section';

function parseBlocks(source) {
    const lines = source
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => line.trim());
    const blocks = [];
    const usedIds = new Set();
    let i = 0;

    /** A heading's id: the explicit one, else from its text; never repeated. */
    const headingId = (wanted) => {
        let id = wanted;
        for (let n = 2; usedIds.has(id); n++) id = `${wanted}-${n}`;
        usedIds.add(id);
        return id;
    };

    /** Consume the run of lines matching `pattern`, keeping capture 1 of each. */
    const take = (pattern) => {
        const items = [];
        while (i < lines.length && pattern.test(lines[i])) {
            items.push(lines[i].match(pattern)[1]);
            i++;
        }
        return items;
    };

    while (i < lines.length) {
        const line = lines[i];

        if (!line) {
            i++;
        } else if (HEADING.test(line)) {
            const [, hashes, raw] = line.match(HEADING);
            const explicit = raw.match(ANCHOR)?.[1];
            const text = raw.replace(ANCHOR, '');
            blocks.push({
                type: hashes.length === 2 ? 'h2' : 'h3',
                text,
                id: headingId(explicit ? explicit.toLowerCase() : slugify(text)),
            });
            i++;
        } else if (BULLET.test(line)) {
            blocks.push({ type: 'ul', items: take(BULLET) });
        } else if (NUMBERED.test(line)) {
            blocks.push({ type: 'ol', items: take(NUMBERED) });
        } else if (isTableRow(line)) {
            const rows = [];
            while (i < lines.length && isTableRow(lines[i])) {
                rows.push(splitRow(lines[i]));
                i++;
            }
            // rows[1] is the |---|---| divider between the header and the body.
            blocks.push({ type: 'table', head: rows[0], body: rows.slice(2) });
        } else {
            const text = [];
            do {
                text.push(lines[i]);
                i++;
            } while (i < lines.length && lines[i] && !startsBlock(lines[i]));
            blocks.push({ type: 'p', text: text.join(' ') });
        }
    }

    return blocks;
}

function renderInline(text, keyPrefix) {
    const nodes = [];
    let cursor = 0;
    let count = 0;

    for (const match of text.matchAll(INLINE)) {
        const [whole, bold, italic, linkText, href, code, escaped] = match;
        const key = `${keyPrefix}.${count++}`;

        if (match.index > cursor) nodes.push(text.slice(cursor, match.index));

        if (bold !== undefined) {
            // Bold may wrap a link or an italic name, so its contents are
            // parsed again.
            nodes.push(<strong key={key}>{renderInline(bold, key)}</strong>);
        } else if (italic !== undefined) {
            nodes.push(<em key={key}>{renderInline(italic, key)}</em>);
        } else if (href !== undefined) {
            // Link text can hold an italic species name or an escape.
            const label = renderInline(linkText, key);
            nodes.push(
                isExternal(href) ? (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer">
                        {label}
                    </a>
                ) : (
                    <a key={key} href={href}>
                        {label}
                    </a>
                )
            );
        } else if (code !== undefined) {
            nodes.push(<code key={key}>{code}</code>);
        } else {
            nodes.push(escaped);
        }

        cursor = match.index + whole.length;
    }

    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
}

/** Inline Markdown reduced to its text, for attributes such as data-label. */
const plainText = (text) =>
    text.replace(INLINE, (whole, bold, italic, linkText, href, code, escaped) =>
        plainText(bold ?? italic ?? linkText ?? code ?? escaped ?? '')
    );

function renderBlock(block, index, options = {}) {
    const key = `b${index}`;

    switch (block.type) {
        case 'h2':
            return <h2 key={key} id={block.id}>{renderInline(block.text, key)}</h2>;
        case 'h3':
            return (
                <h3 key={key} id={block.id}>
                    {renderInline(block.text, key)}
                    {/* A "#" link to the heading itself, so its address can
                        be copied (the glossary's terms). */}
                    {options.headingLinks && (
                        <a className="heading-anchor" href={`#${block.id}`} aria-label={options.anchorLabel}>
                            #
                        </a>
                    )}
                </h3>
            );
        case 'ul':
        case 'ol': {
            const List = block.type;
            return (
                <List key={key}>
                    {block.items.map((item, n) => (
                        <li key={n}>{renderInline(item, `${key}.${n}`)}</li>
                    ))}
                </List>
            );
        }
        case 'table':
            return (
                <div className="markdown-table" key={key}>
                    <table>
                        <thead>
                            <tr>
                                {block.head.map((cell, n) => (
                                    <th key={n} scope="col">
                                        {renderInline(cell, `${key}.h${n}`)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {block.body.map((row, r) => (
                                <tr key={r}>
                                    {/* data-label lets the phone layout show the
                                        column heading beside each cell. */}
                                    {row.map((cell, c) => (
                                        <td key={c} data-label={plainText(block.head[c])}>
                                            {renderInline(cell, `${key}.${r}.${c}`)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        default:
            return <p key={key}>{renderInline(block.text, key)}</p>;
    }
}

/**
 * `headingLinks`: give every ### heading a "#" link to itself, labelled
 * `anchorLabel` for screen readers.
 */
const Markdown = ({ source, headingLinks = false, anchorLabel }) => (
    <div className="markdown">
        {parseBlocks(source).map((block, i) => renderBlock(block, i, { headingLinks, anchorLabel }))}
    </div>
);

/** One line of inline Markdown (italic, bold, links) with no block wrapper. */
export const InlineMarkdown = ({ text }) => <>{renderInline(text, 'i')}</>;

export default Markdown;

import { CONTACT_INFO } from '../config';
import './Markdown.css';

/**
 * A deliberately small Markdown renderer for this site's own long-form text
 * (the privacy policy in src/content/).
 *
 * Why not a library: the public pages are imported eagerly so that they can be
 * prerendered (see App.jsx), which means anything pulled in here is downloaded
 * on every page. A full parser would weigh more than the text it renders, and
 * the policy needs only a handful of constructs. This supports exactly:
 *
 *   ## and ### headings     paragraphs        - bullet lists
 *   1. numbered lists       | pipe | tables   **bold**  `code`  [text](url)
 *
 * Anything else comes out as plain text. The source is always a file from
 * this repository, never visitor input, and it is rendered as React elements
 * rather than injected as HTML.
 */

const HEADING = /^(#{2,3})\s+(.+)$/;
const BULLET = /^-\s+(.+)$/;
const NUMBERED = /^\d+\.\s+(.+)$/;
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g;

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

function parseBlocks(source) {
    const lines = source
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => line.trim());
    const blocks = [];
    let i = 0;

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
            const [, hashes, text] = line.match(HEADING);
            blocks.push({ type: hashes.length === 2 ? 'h2' : 'h3', text });
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
        const [whole, bold, linkText, href, code] = match;
        const key = `${keyPrefix}.${count++}`;

        if (match.index > cursor) nodes.push(text.slice(cursor, match.index));

        if (bold !== undefined) {
            // Bold may wrap a link, so its contents are parsed again.
            nodes.push(<strong key={key}>{renderInline(bold, key)}</strong>);
        } else if (href !== undefined) {
            nodes.push(
                isExternal(href) ? (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer">
                        {linkText}
                    </a>
                ) : (
                    <a key={key} href={href}>
                        {linkText}
                    </a>
                )
            );
        } else {
            nodes.push(<code key={key}>{code}</code>);
        }

        cursor = match.index + whole.length;
    }

    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
}

function renderBlock(block, index) {
    const key = `b${index}`;

    switch (block.type) {
        case 'h2':
            return <h2 key={key}>{renderInline(block.text, key)}</h2>;
        case 'h3':
            return <h3 key={key}>{renderInline(block.text, key)}</h3>;
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
                                        <td key={c} data-label={block.head[c]}>
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

const Markdown = ({ source }) => (
    <div className="markdown">{parseBlocks(source).map(renderBlock)}</div>
);

export default Markdown;

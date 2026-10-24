/**
 * The terms of a glossary page, read from its Markdown: every
 * `### Term {#anchor}` heading and the paragraph under it. Used for the
 * page's DefinedTerm structured data, so the terms are written once, in the
 * Markdown, and never copied into code.
 */
const TERM = /^###\s+(.+?)\s*\{#([a-z0-9-]+)\}\s*$/i;

/** Inline Markdown reduced to plain text: links, emphasis, code. */
const plain = (text) =>
    text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\\(.)/g, '$1')
        .trim();

export function termsFromMarkdown(source) {
    const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
    const terms = [];
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].trim().match(TERM);
        if (!m) continue;
        const description = [];
        for (let j = i + 1; j < lines.length; j++) {
            const line = lines[j].trim();
            if (/^#{2,3}\s/.test(line)) break;
            if (!line) {
                if (description.length) break;
                continue;
            }
            description.push(line);
        }
        terms.push({ id: m[2], name: plain(m[1]), description: plain(description.join(' ')) });
    }
    return terms;
}

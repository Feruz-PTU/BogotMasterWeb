/**
 * The draft marks that must never reach the live site: "[owner: …]" for a
 * fact still missing from the owner, "[verify …]" for a claim not yet
 * checked. Shared by the build guard (scripts/content-guard.mjs) and the admin
 * FAQ editor; supabase/faq.sql applies the same rule to published answers.
 *
 * Matches "[owner:", "[verify]" and "[verify in the tariff]", in any case.
 */
export const PLACEHOLDER = /\[(owner:|verify\b)[^\]\n]*\]?/gi;

/** Every mark in a text, as the matched strings. */
export function findPlaceholders(text) {
    if (typeof text !== 'string' || !text) return [];
    return [...text.matchAll(PLACEHOLDER)].map((m) => m[0]);
}

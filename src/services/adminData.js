/**
 * Admin write operations, wrapped so that every successful save also asks the
 * site to rebuild.
 *
 * The public pages are prerendered, so a saved edit is not visible to visitors
 * until a new build finishes. Rather than adding a rebuild call to each of the
 * nine save sites in the dashboard (and forgetting it on the tenth), the
 * dashboard imports its write functions from here.
 *
 * Rebuilds are debounced: editing six fields in a row starts one build, not
 * six. The rebuild runs in the background and its failure never turns a
 * successful save into an error — the data is saved either way.
 */

import {
    saveProduct as _saveProduct,
    saveProducts as _saveProducts,
    saveSettings as _saveSettings,
    saveTranslations as _saveTranslations,
    deleteProduct as _deleteProduct,
    seedDatabase as _seedDatabase,
    saveFaq as _saveFaq,
    saveFaqs as _saveFaqs,
    deleteFaq as _deleteFaq,
} from '../supabase/data';
import { requestRebuild } from './rebuildService';

const DEBOUNCE_MS = 8000;
let timer = null;
let listener = null;

/** Called by the dashboard to show rebuild status in its toast. */
export function onRebuildStatus(fn) {
    listener = fn;
}

function scheduleRebuild() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
        timer = null;
        const result = await requestRebuild();
        if (listener) listener(result);
    }, DEBOUNCE_MS);
}

const withRebuild =
    (fn) =>
    async (...args) => {
        const result = await fn(...args);
        scheduleRebuild();
        return result;
    };

export const saveProduct = withRebuild(_saveProduct);
export const saveProducts = withRebuild(_saveProducts);
export const saveSettings = withRebuild(_saveSettings);
export const saveTranslations = withRebuild(_saveTranslations);
export const deleteProduct = withRebuild(_deleteProduct);
export const seedDatabase = withRebuild(_seedDatabase);

// FAQ: only published answers are on the site, so a save rebuilds only when
// the answer is published now or was before (publishing or unpublishing it).
const touchesSite = (...items) => items.some((i) => i?.status === 'published');

/** `previous` is the answer as it was loaded, or null for a new one. */
export async function saveFaq(item, previous = null) {
    const saved = await _saveFaq(item);
    if (touchesSite(saved, previous)) scheduleRebuild();
    return saved;
}

export async function saveFaqs(items) {
    await _saveFaqs(items);
    if (touchesSite(...items)) scheduleRebuild();
}

export async function deleteFaq(item) {
    await _deleteFaq(item.id);
    if (touchesSite(item)) scheduleRebuild();
}

// Read operations are re-exported unchanged so the dashboard has one import.
export {
    fetchFaq,
    fetchProducts,
    fetchSettings,
    isDatabaseSeeded,
    fetchInquiries,
    markInquiryRead,
    deleteInquiry,
    fetchStats,
    fetchTranslations,
    fetchEventSummary,
    fetchProductPageViews,
    SEED_TRANSLATIONS,
} from '../supabase/data';

// A lead's status is not on the public site, so saving it starts no rebuild.
export { updateInquiryStatus } from '../supabase/data';

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

// Read operations are re-exported unchanged so the dashboard has one import.
export {
    fetchProducts,
    fetchSettings,
    isDatabaseSeeded,
    fetchInquiries,
    markInquiryRead,
    deleteInquiry,
    fetchStats,
    fetchTranslations,
    fetchEventSummary,
    SEED_TRANSLATIONS,
} from '../supabase/data';

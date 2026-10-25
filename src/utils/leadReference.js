/**
 * A lead's reference, such as "BM-7K4Q2". The browser makes it once per send;
 * it is saved with the lead, shown on the success screen and in the admin, and
 * put in both emails (api/send.js checks it and makes its own if it is missing).
 *
 * Five characters from 27: the digits 2–9 and the consonants without L. No
 * reference can be misread (no 0/O, 1/I/L) or spell a word. That makes about
 * 14 million references, so two leads sharing one is very unlikely.
 */
const ALPHABET = '23456789BCDFGHJKMNPQRSTVWXZ';
const LENGTH = 5;

export const REFERENCE_RE = new RegExp(`^BM-[${ALPHABET}]{${LENGTH}}$`);

export function makeReference() {
    const picks = new Uint32Array(LENGTH);
    if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(picks);
    } else {
        for (let i = 0; i < LENGTH; i++) picks[i] = Math.floor(Math.random() * 2 ** 32);
    }
    return `BM-${Array.from(picks, (n) => ALPHABET[n % ALPHABET.length]).join('')}`;
}

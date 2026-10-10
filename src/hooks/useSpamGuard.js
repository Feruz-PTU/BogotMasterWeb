import { useRef, useState, useCallback } from 'react';

/**
 * Two cheap, privacy-respecting bot defences, shared by all three forms.
 *
 * 1. Honeypot — a field that is invisible and skipped by real users but that
 *    most automated scripts fill in because they complete every input they
 *    find. Anything that fills it is rejected.
 * 2. Timing — a human cannot read a form and type a real enquiry in under a
 *    couple of seconds. Submissions faster than MIN_SECONDS are rejected.
 *
 * Neither needs a captcha, an account, a cookie, or a third-party service,
 * and neither asks the visitor to prove anything. They will not stop a
 * determined attacker — that needs the server-side work in api/send.js plus
 * a rate-limit store — but they stop the commodity spam bots that make up
 * almost all form abuse.
 *
 * The honeypot is hidden with off-screen positioning rather than
 * `display:none`, because some bots specifically skip display:none fields.
 */

const MIN_SECONDS = 3;

export const HONEYPOT_NAME = 'company_website';

export const honeypotStyle = {
    position: 'absolute',
    left: '-9999px',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
};

export function useSpamGuard() {
    const mountedAt = useRef(Date.now());
    const [honeypot, setHoneypot] = useState('');

    /** Returns true when the submission looks automated. */
    const isLikelyBot = useCallback(() => {
        if (honeypot.trim() !== '') return true;
        const elapsed = (Date.now() - mountedAt.current) / 1000;
        return elapsed < MIN_SECONDS;
    }, [honeypot]);

    /** Spread onto the hidden input. */
    const honeypotProps = {
        type: 'text',
        name: HONEYPOT_NAME,
        value: honeypot,
        onChange: (e) => setHoneypot(e.target.value),
        tabIndex: -1,
        autoComplete: 'off',
        'aria-hidden': 'true',
        style: honeypotStyle,
    };

    /** Sent to the server so it can apply the same checks independently. */
    const guardPayload = () => ({
        [HONEYPOT_NAME]: honeypot,
        elapsed_ms: Date.now() - mountedAt.current,
    });

    const reset = () => {
        mountedAt.current = Date.now();
        setHoneypot('');
    };

    return { honeypotProps, isLikelyBot, guardPayload, reset };
}

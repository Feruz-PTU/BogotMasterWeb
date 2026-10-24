import { useEffect, useId, useMemo, useRef, useState } from 'react';
import './RequestForm.css';
import LocalLink from './LocalLink';
import SocialButtons from './SocialButtons';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useSpamGuard } from '../hooks/useSpamGuard';
import { track, leadContext } from '../analytics';
import { sendRequest } from '../services/emailService';
import { isValidEmail, isValidPhone } from '../utils/formValidation';
import { isLicoriceRoot } from '../utils/productKind';
import { INCOTERMS_ANY, INCOTERMS_SEA, QUANTITY_UNITS, incotermLabel } from '../i18n/incoterms';
import {
    REQUEST_TYPES,
    FIELDS_BY_TYPE,
    APPLICATIONS,
    STANDARDS,
    NEEDED_BY,
    CHANNELS,
    findRequestType,
    isValidAmount,
    belowMinimum,
    formatAmount,
    isFreeMail,
    countryNames,
} from '../utils/requestOptions';

const EMPTY = {
    annual: '',
    annual_unit: 't',
    application: '',
    standard: '',
    country: '',
    port: '',
    incoterms: '',
    needed: '',
    name: '',
    company: '',
    email: '',
    phone: '',
    channel: '',
    sample_address: '',
    fedex: '',
    message: '',
};

/** Free samples cover licorice root only, not the partner's extract (owner). */
const forSample = (product) => isLicoriceRoot(product);
const pickable = (product) => isLicoriceRoot(product) || product.slug === 'extract';

const ErrorIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
    </svg>
);

/**
 * One request form with four request types: price quote, free sample, spec
 * sheet and documents, other question (Appendix A §A2). The type decides
 * which fields show and which are required (utils/requestOptions.js).
 *
 * - `initialType`: 'quote' | 'sample' | 'docs' | 'other'.
 * - `initialProducts`: product slugs, or { slug, quantity, unit } lines, to
 *   start with (the page's product, or the quote cart).
 * - `onLinkClick`: called when the privacy link is followed, so a modal
 *   holding the form can close.
 * - `onSent(type)`: called after a request is sent.
 *
 * Give the form a `key` that changes with its starting values, so a new start
 * never shows inside the old state.
 */
const RequestForm = ({ initialType = 'quote', initialProducts = [], onLinkClick, onSent }) => {
    const { t, language } = useLanguage();
    const { products } = useContent();
    const uid = useId();
    const fieldId = (name) => `${uid}-${name}`;

    const choices = useMemo(() => products.filter(pickable), [products]);
    const productBySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
    const titleOf = (slug) => productBySlug.get(slug)?.title || slug;

    const [type, setType] = useState(findRequestType(initialType).value);
    const [lines, setLines] = useState(() =>
        initialProducts
            .map((p) => (typeof p === 'string' ? { slug: p } : p))
            .filter((p) => choices.some((c) => c.slug === p.slug))
            .map((p) => ({ slug: p.slug, quantity: p.quantity || '', unit: p.unit || 't' }))
    );
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState(null); // null | 'sending' | 'error' | 'success'
    const [countries, setCountries] = useState([]);
    const { honeypotProps, isLikelyBot, guardPayload, reset } = useSpamGuard();
    const successRef = useRef(null);

    const requestType = findRequestType(type);
    const fields = FIELDS_BY_TYPE[type];
    const shows = (f) => fields.show.includes(f);
    const required = (f) => fields.required.includes(f);

    // Country names come from the browser, after hydration (see countryNames).
    useEffect(() => {
        setCountries(countryNames(language));
    }, [language]);

    useEffect(() => {
        if (status === 'success') successRef.current?.focus();
    }, [status]);

    const clearError = (name) => {
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        clearError(name);
        // A filled phone, or a channel that needs none, settles the phone error.
        if (name === 'channel') clearError('phone');
    };

    const changeType = (value) => {
        setType(value);
        setErrors({});
        if (status === 'error') setStatus(null);
    };

    const addLine = (e) => {
        const slug = e.target.value;
        if (!slug) return;
        setLines((prev) => (prev.some((l) => l.slug === slug) ? prev : [...prev, { slug, quantity: '', unit: 't' }]));
        clearError('products');
    };

    const updateLine = (slug, patch) => {
        setLines((prev) => prev.map((l) => (l.slug === slug ? { ...l, ...patch } : l)));
        clearError(`qty-${slug}`);
    };

    const removeLine = (slug) => {
        setLines((prev) => prev.filter((l) => l.slug !== slug));
        setErrors((prev) => ({ ...prev, [`qty-${slug}`]: '', products: '' }));
    };

    const validate = () => {
        const e = {};
        if (shows('products')) {
            if (lines.length === 0) e.products = t('form_err_products');
            else if (type === 'sample' && lines.some((l) => !forSample(productBySlug.get(l.slug)))) {
                e.products = t('form_err_sample_root');
            }
        }
        if (shows('quantity')) {
            for (const l of lines) if (!isValidAmount(l.quantity)) e[`qty-${l.slug}`] = t('form_err_amount');
        }
        if (shows('annual') && !isValidAmount(form.annual)) e.annual = t('form_err_amount');
        if (required('country') && !form.country.trim()) e.country = t('form_err_country');
        if (form.name.trim().length < 2) e.name = t('form_err_name');
        if (required('company') && !form.company.trim()) e.company = t('form_err_company');
        if (!form.email.trim()) e.email = t('form_err_email');
        else if (!isValidEmail(form.email)) e.email = t('form_err_email_invalid');
        const channel = CHANNELS.find((c) => c.value === form.channel);
        if (form.phone.trim() && !isValidPhone(form.phone)) e.phone = t('form_err_phone');
        else if (!form.phone.trim() && channel?.needsPhone) e.phone = t('form_err_phone_needed');
        if (required('sample_address') && !form.sample_address.trim()) e.sample_address = t('form_err_sample_address');
        return e;
    };

    // In the order the fields appear, for moving focus to the first error.
    const errorOrder = [
        'products',
        ...lines.map((l) => `qty-${l.slug}`),
        'annual',
        'country',
        'name',
        'company',
        'email',
        'phone',
        'sample_address',
    ];

    /** What is sent: only the fields this type shows. */
    const buildRequest = () => {
        const text = (v) => String(v || '').trim();
        return {
            type: requestType.lead,
            name: text(form.name),
            email: text(form.email),
            phone: text(form.phone),
            company: text(form.company),
            items: shows('products')
                ? lines.map((l) => ({
                      slug: l.slug,
                      title: titleOf(l.slug),
                      quantity: shows('quantity') ? formatAmount(l.quantity, l.unit) : '',
                  }))
                : [],
            annual_volume: shows('annual') ? formatAmount(form.annual, form.annual_unit) : '',
            application: shows('application') ? form.application : '',
            standard: shows('standard') ? form.standard : '',
            destination_country: shows('country') ? text(form.country) : '',
            destination_port: shows('port') ? text(form.port) : '',
            incoterms: shows('incoterms') ? form.incoterms : '',
            timeline: shows('needed') ? form.needed : '',
            preferred_channel: form.channel,
            sample_address: shows('sample_address') ? text(form.sample_address) : '',
            fedex_account: shows('fedex') ? text(form.fedex) : '',
            message: text(form.message),
        };
    };

    const finish = () => {
        setStatus('success');
        setForm(EMPTY);
        setLines([]);
        setErrors({});
        onSent?.(type);
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        const first = errorOrder.find((k) => e[k]);
        if (first) {
            document.getElementById(fieldId(first))?.focus();
            return;
        }
        // Silently accept and discard: telling a bot why it failed helps it.
        if (isLikelyBot()) {
            finish();
            return;
        }
        setStatus('sending');
        try {
            const res = await sendRequest(
                { ...buildRequest(), ...guardPayload(), ...leadContext(language) },
                language
            );
            if (!res.success) throw new Error(res.message);
            track(requestType.event);
            reset();
            finish();
        } catch {
            setStatus('error');
        }
    };

    const startOver = () => {
        setStatus(null);
        reset();
    };

    // aria-describedby for a field: its hint, its error, its soft note.
    const describedBy = (name, { hint = false, soft = false } = {}) =>
        [hint && fieldId(`${name}-hint`), errors[name] && fieldId(`${name}-error`), soft && fieldId(`${name}-soft`)]
            .filter(Boolean)
            .join(' ') || undefined;

    const errorText = (name) =>
        errors[name] ? (
            <span className="rf-error" id={fieldId(`${name}-error`)}>
                <ErrorIcon />
                {errors[name]}
            </span>
        ) : null;

    const requiredMark = <span className="rf-required" aria-hidden="true">*</span>;
    const optionalMark = <span className="form-optional">({t('form_optional')})</span>;

    /** A text input with its label, hint and error. */
    const input = (name, label, { isRequired = false, hint, ...props } = {}) => (
        <div className="rf-field">
            <label htmlFor={fieldId(name)}>
                {label} {isRequired && requiredMark}
            </label>
            <input
                id={fieldId(name)}
                name={name}
                value={form[name]}
                onChange={handleChange}
                aria-required={isRequired ? 'true' : undefined}
                aria-invalid={errors[name] ? 'true' : undefined}
                aria-describedby={describedBy(name, { hint: Boolean(hint) })}
                className={errors[name] ? 'error' : ''}
                {...props}
            />
            {hint && <span className="form-hint" id={fieldId(`${name}-hint`)}>{hint}</span>}
            {errorText(name)}
        </div>
    );

    /** A select with a "Choose…" first option. */
    const select = (name, label, options, { hint, empty = t('rf_choose') } = {}) => (
        <div className="rf-field">
            <label htmlFor={fieldId(name)}>{label}</label>
            <select
                id={fieldId(name)}
                name={name}
                value={form[name]}
                onChange={handleChange}
                aria-describedby={hint ? fieldId(`${name}-hint`) : undefined}
            >
                <option value="">{empty}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.key)}</option>
                ))}
            </select>
            {hint && <span className="form-hint" id={fieldId(`${name}-hint`)}>{hint}</span>}
        </div>
    );

    if (status === 'success') {
        return (
            <div className="rf-success" role="status" tabIndex={-1} ref={successRef}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="M22 4 12 14.01l-3-3" />
                </svg>
                <h3>{t('rf_success_title')}</h3>
                <p>{t('rf_success_text')}</p>
                <button type="button" className="rf-again" onClick={startOver}>{t('rf_success_again')}</button>
            </div>
        );
    }

    const emailSoft = type === 'sample' && isFreeMail(form.email) && !errors.email;

    return (
        <form className="rf" onSubmit={handleSubmit} noValidate>
            <input {...honeypotProps} />

            <fieldset className="rf-types">
                <legend>{t('rf_type_label')}</legend>
                <div className="rf-type-options">
                    {REQUEST_TYPES.map((r) => (
                        <label key={r.value} className={`rf-type${type === r.value ? ' active' : ''}`}>
                            <input
                                type="radio"
                                name={fieldId('type')}
                                value={r.value}
                                checked={type === r.value}
                                onChange={() => changeType(r.value)}
                            />
                            <span>{t(r.key)}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <p className="rf-required-note">{t('rf_required_note')}</p>

            {shows('products') && (
                <div className="rf-field rf-products">
                    <label htmlFor={fieldId('products')}>
                        {t('rf_products')} {requiredMark}
                    </label>
                    <span className="form-hint" id={fieldId('products-hint')}>{t(`rf_products_hint_${type}`)}</span>
                    {lines.length > 0 && (
                        <ul className="rf-lines">
                            {lines.map((l) => {
                                const title = titleOf(l.slug);
                                const qtyName = `qty-${l.slug}`;
                                const soft = shows('quantity') && belowMinimum(l.quantity, l.unit);
                                return (
                                    <li key={l.slug} className="rf-line">
                                        <div className="rf-line-main">
                                            <span className="rf-line-title">{title}</span>
                                            {shows('quantity') && (
                                                <div className="rf-line-qty">
                                                    <input
                                                        id={fieldId(qtyName)}
                                                        inputMode="decimal"
                                                        maxLength={12}
                                                        value={l.quantity}
                                                        onChange={(e) => updateLine(l.slug, { quantity: e.target.value })}
                                                        placeholder={t('rf_quantity')}
                                                        aria-label={`${t('rf_quantity')}: ${title}`}
                                                        aria-invalid={errors[qtyName] ? 'true' : undefined}
                                                        aria-describedby={describedBy(qtyName, { soft })}
                                                        className={errors[qtyName] ? 'error' : ''}
                                                    />
                                                    <select
                                                        value={l.unit}
                                                        onChange={(e) => updateLine(l.slug, { unit: e.target.value })}
                                                        aria-label={`${t('quote_unit')}: ${title}`}
                                                    >
                                                        {QUANTITY_UNITS.map((u) => (
                                                            <option key={u.value} value={u.value}>{t(u.label)}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className="rf-line-remove"
                                                onClick={() => removeLine(l.slug)}
                                                aria-label={t('rf_products_remove').replace('{product}', title)}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                    <path d="M6 18 18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        {errorText(qtyName)}
                                        {soft && (
                                            <span className="rf-soft" id={fieldId(`${qtyName}-soft`)}>{t('rf_quantity_soft')}</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <select
                        id={fieldId('products')}
                        value=""
                        onChange={addLine}
                        aria-required="true"
                        aria-invalid={errors.products ? 'true' : undefined}
                        aria-describedby={describedBy('products', { hint: true })}
                        className={errors.products ? 'error' : ''}
                    >
                        <option value="">{t('rf_products_add')}</option>
                        {choices
                            .filter((p) => !lines.some((l) => l.slug === p.slug))
                            .filter((p) => type !== 'sample' || forSample(p))
                            .map((p) => (
                                <option key={p.slug} value={p.slug}>{p.title}</option>
                            ))}
                    </select>
                    {errorText('products')}
                    {shows('quantity') && <span className="form-hint">{t('rf_quantity_hint')}</span>}
                </div>
            )}

            {shows('annual') && (
                <div className="rf-field">
                    <label htmlFor={fieldId('annual')}>{t('rf_annual')}</label>
                    <div className="rf-amount">
                        <input
                            id={fieldId('annual')}
                            name="annual"
                            inputMode="decimal"
                            maxLength={12}
                            value={form.annual}
                            onChange={handleChange}
                            aria-invalid={errors.annual ? 'true' : undefined}
                            aria-describedby={describedBy('annual', { hint: true })}
                            className={errors.annual ? 'error' : ''}
                        />
                        <select
                            name="annual_unit"
                            value={form.annual_unit}
                            onChange={handleChange}
                            aria-label={`${t('quote_unit')}: ${t('rf_annual')}`}
                        >
                            {QUANTITY_UNITS.map((u) => (
                                <option key={u.value} value={u.value}>{t(u.label)}</option>
                            ))}
                        </select>
                    </div>
                    <span className="form-hint" id={fieldId('annual-hint')}>{t('rf_annual_hint')}</span>
                    {errorText('annual')}
                </div>
            )}

            {shows('application') && select('application', t('rf_application'), APPLICATIONS, { hint: t('rf_application_hint') })}
            {shows('standard') && select('standard', t('rf_standard'), STANDARDS, { hint: t('rf_standard_hint') })}

            {shows('country') && (
                <>
                    {input('country', t('rf_country'), {
                        isRequired: required('country'),
                        list: fieldId('countries'),
                        autoComplete: 'country-name',
                        maxLength: 80,
                    })}
                    <datalist id={fieldId('countries')}>
                        {countries.map((c) => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </>
            )}
            {shows('port') && input('port', t('rf_port'), { maxLength: 80 })}

            {shows('incoterms') && (
                <div className="rf-field">
                    <label htmlFor={fieldId('incoterms')}>{t('rf_incoterms')}</label>
                    <select
                        id={fieldId('incoterms')}
                        name="incoterms"
                        value={form.incoterms}
                        onChange={handleChange}
                        aria-describedby={fieldId('incoterms-hint')}
                    >
                        <option value="">{t('rf_incoterms_unsure')}</option>
                        <optgroup label={t('quote_incoterms_any')}>
                            {INCOTERMS_ANY.map((code) => (
                                <option key={code} value={code}>{incotermLabel(code, language)}</option>
                            ))}
                        </optgroup>
                        <optgroup label={t('quote_incoterms_sea')}>
                            {INCOTERMS_SEA.map((code) => (
                                <option key={code} value={code}>{incotermLabel(code, language)}</option>
                            ))}
                        </optgroup>
                    </select>
                    <span className="form-hint" id={fieldId('incoterms-hint')}>{t('rf_incoterms_hint')}</span>
                </div>
            )}

            {shows('needed') && select('needed', t('rf_needed'), NEEDED_BY, { hint: t('rf_needed_hint') })}

            <div className="rf-group">
                {input('name', t('rf_name'), { isRequired: true, autoComplete: 'name', maxLength: 100 })}
                {input('company', t('rf_company'), {
                    isRequired: required('company'),
                    autoComplete: 'organization',
                    maxLength: 200,
                })}

                <div className="rf-field">
                    <label htmlFor={fieldId('email')}>
                        {t('rf_email')} {requiredMark}
                    </label>
                    <input
                        id={fieldId('email')}
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        maxLength={254}
                        value={form.email}
                        onChange={handleChange}
                        aria-required="true"
                        aria-invalid={errors.email ? 'true' : undefined}
                        aria-describedby={describedBy('email', { soft: emailSoft })}
                        className={errors.email ? 'error' : ''}
                    />
                    {errorText('email')}
                    {emailSoft && <span className="rf-soft" id={fieldId('email-soft')}>{t('rf_email_soft')}</span>}
                </div>

                <div className="rf-field">
                    <label htmlFor={fieldId('phone')}>
                        {t('rf_phone')} {optionalMark}
                    </label>
                    <input
                        id={fieldId('phone')}
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        maxLength={32}
                        value={form.phone}
                        onChange={handleChange}
                        aria-invalid={errors.phone ? 'true' : undefined}
                        aria-describedby={describedBy('phone', { hint: true })}
                        className={errors.phone ? 'error' : ''}
                    />
                    <span className="form-hint" id={fieldId('phone-hint')}>{t('rf_phone_hint')}</span>
                    {errorText('phone')}
                </div>

                <fieldset className="rf-field rf-channels">
                    <legend>{t('rf_channel')}</legend>
                    <div className="rf-channel-options">
                        {CHANNELS.map((c) => (
                            <label key={c.value} className={`rf-channel${form.channel === c.value ? ' active' : ''}`}>
                                <input
                                    type="radio"
                                    name="channel"
                                    value={c.value}
                                    checked={form.channel === c.value}
                                    onChange={handleChange}
                                />
                                <span>{t(c.key)}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>

            {shows('sample_address') && (
                <div className="rf-field">
                    <label htmlFor={fieldId('sample_address')}>
                        {t('rf_sample_address')} {requiredMark}
                    </label>
                    <textarea
                        id={fieldId('sample_address')}
                        name="sample_address"
                        rows="2"
                        maxLength={300}
                        autoComplete="street-address"
                        value={form.sample_address}
                        onChange={handleChange}
                        aria-required="true"
                        aria-invalid={errors.sample_address ? 'true' : undefined}
                        aria-describedby={describedBy('sample_address', { hint: true })}
                        className={errors.sample_address ? 'error' : ''}
                    />
                    <span className="form-hint" id={fieldId('sample_address-hint')}>{t('rf_sample_address_hint')}</span>
                    {errorText('sample_address')}
                </div>
            )}
            {shows('fedex') && (
                <div className="rf-field">
                    <label htmlFor={fieldId('fedex')}>
                        {t('rf_fedex')} {optionalMark}
                    </label>
                    <input id={fieldId('fedex')} name="fedex" maxLength={40} value={form.fedex} onChange={handleChange} />
                </div>
            )}

            <div className="rf-field">
                <label htmlFor={fieldId('message')}>{t('rf_message')}</label>
                <textarea
                    id={fieldId('message')}
                    name="message"
                    rows="4"
                    maxLength={5000}
                    value={form.message}
                    onChange={handleChange}
                    aria-describedby={fieldId('message-hint')}
                />
                <span className="form-hint" id={fieldId('message-hint')}>{t('rf_message_hint')}</span>
            </div>

            {status === 'error' && (
                <div className="rf-send-error" role="alert">
                    <ErrorIcon />
                    <span>{t('modal_error')}</span>
                </div>
            )}

            <button type="submit" className="rf-submit" disabled={status === 'sending'}>
                {status === 'sending' ? t('form_sending') : t(requestType.submitKey)}
            </button>

            <p className="rf-promise">
                {t('rf_promise')}{' '}
                <LocalLink to="/privacy" onClick={onLinkClick}>{t('privacy_title')}</LocalLink>
            </p>

            <div className="rf-alt">
                <p>{t('rf_or_message')}</p>
                <SocialButtons productName={lines.length ? titleOf(lines[0].slug) : ''} />
            </div>
        </form>
    );
};

export default RequestForm;

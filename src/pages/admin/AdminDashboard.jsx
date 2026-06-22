import { useState, useEffect, useLayoutEffect, useRef, useMemo, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uploadProductImage, uploadGalleryImage, signOut, onAuth } from '../../supabase/config';
import {
    fetchProducts, fetchSettings,
    saveProduct, saveSettings, deleteProduct,
    seedDatabase, isDatabaseSeeded,
    fetchInquiries, markInquiryRead, deleteInquiry,
    fetchStats,
    fetchTranslations, saveTranslations,
    SEED_TRANSLATIONS,
} from '../../supabase/data';
import { useLanguage } from '../../context/LanguageContext';
import './Admin.css';

const TRANSLATION_GROUPS = [
    {
        id: 'nav', label: 'Navigation & UI',
        keys: [
            { key: 'home', label: 'Home link' },
            { key: 'products', label: 'Products link' },
            { key: 'about', label: 'About link' },
            { key: 'contact', label: 'Contact link' },
            { key: 'contactBtn', label: 'Contact button' },
            { key: 'read_more', label: 'Read more' },
        ],
    },
    {
        id: 'hero', label: 'Hero',
        keys: [
            { key: 'hero_cta', label: 'CTA button' },
            { key: 'hero_modal_title', label: 'Modal title' },
            { key: 'hero_image_alt', label: 'Image alt text' },
        ],
    },
    {
        id: 'about', label: 'About Section',
        keys: [
            { key: 'about_title', label: 'Section title' },
            { key: 'about_p1', label: 'Paragraph 1', multiline: true },
            { key: 'about_p2', label: 'Paragraph 2', multiline: true },
            { key: 'about_p3', label: 'Paragraph 3', multiline: true },
            { key: 'about_p4', label: 'Paragraph 4', multiline: true },
            { key: 'about_benefit_1', label: 'Benefit 1' },
            { key: 'about_benefit_2', label: 'Benefit 2' },
            { key: 'about_benefit_3', label: 'Benefit 3' },
            { key: 'about_benefit_4', label: 'Benefit 4' },
            { key: 'about_img_1', label: 'Image Alt 1' },
            { key: 'about_img_2', label: 'Image Alt 2' },
            { key: 'about_img_3', label: 'Image Alt 3' },
            { key: 'about_extra_stat_tons', label: 'Extra stat: Tons' },
            { key: 'about_extra_stat_staff', label: 'Extra stat: Staff' },
            { key: 'consultation_title', label: 'Consultation title' },
        ],
    },
    {
        id: 'stats', label: 'Home Stats',
        keys: [
            { key: 'stat_years', label: 'Years on market' },
            { key: 'stat_tons', label: 'Tons annually' },
            { key: 'stat_experts', label: 'Experts' },
            { key: 'stat_clients', label: 'B2B Clients' },
        ],
    },
    {
        id: 'process', label: 'Process Section',
        keys: [
            { key: 'process_label', label: 'Small label' },
            { key: 'process_title', label: 'Section title' },
            { key: 'process_subtitle', label: 'Subtitle', multiline: true },
            { key: 'process_stage', label: 'Stage label (e.g. Stage/Этап)' },
            { key: 'process_1_title', label: 'Step 1 Title' },
            { key: 'process_1_desc', label: 'Step 1 Desc', multiline: true },
            { key: 'process_2_title', label: 'Step 2 Title' },
            { key: 'process_2_desc', label: 'Step 2 Desc', multiline: true },
            { key: 'process_3_title', label: 'Step 3 Title' },
            { key: 'process_3_desc', label: 'Step 3 Desc', multiline: true },
            { key: 'process_4_title', label: 'Step 4 Title' },
            { key: 'process_4_desc', label: 'Step 4 Desc', multiline: true },
        ],
    },
    {
        id: 'products', label: 'Products Section',
        keys: [
            { key: 'our_products', label: 'Section heading' },
            { key: 'view_all_products', label: 'View all button' },
            { key: 'related_products', label: 'Related heading' },
            { key: 'get_price', label: 'Get price button' },
            { key: 'specifications', label: 'Specifications heading' },
            { key: 'spec_identity', label: 'Spec: Identity' },
            { key: 'spec_physical', label: 'Spec: Physical' },
            { key: 'spec_quality', label: 'Spec: Quality' },
            { key: 'spec_microbiology', label: 'Spec: Microbiology' },
            { key: 'spec_storage_shelf', label: 'Spec: Storage & Shelf Life' },
            { key: 'spec_botanical_name', label: 'Label: Botanical name' },
            { key: 'spec_origin', label: 'Label: Origin' },
            { key: 'spec_part_used', label: 'Label: Part used' },
            { key: 'spec_cultivation', label: 'Label: Cultivation' },
            { key: 'spec_form_cut_type', label: 'Label: Form / cut type' },
            { key: 'spec_cut_size', label: 'Label: Cut size' },
            { key: 'spec_diameter_grade', label: 'Label: Diameter grade' },
            { key: 'spec_processing', label: 'Label: Processing' },
            { key: 'spec_packaging', label: 'Label: Packaging' },
            { key: 'spec_moq', label: 'Label: MOQ' },
            { key: 'spec_moisture', label: 'Label: Moisture' },
            { key: 'spec_ash', label: 'Label: Ash' },
            { key: 'spec_glycyrrhizin', label: 'Label: Glycyrrhizin' },
            { key: 'spec_foreign_matter', label: 'Label: Foreign matter' },
            { key: 'spec_heavy_metals', label: 'Label: Heavy metals' },
            { key: 'spec_pesticide_residues', label: 'Label: Pesticide residues' },
            { key: 'spec_tpc', label: 'Label: TPC' },
            { key: 'spec_yeast_mould', label: 'Label: Yeast & Mould' },
            { key: 'spec_e_coli', label: 'Label: E. coli' },
            { key: 'spec_salmonella', label: 'Label: Salmonella' },
            { key: 'spec_shelf_life', label: 'Label: Shelf life' },
            { key: 'spec_storage', label: 'Label: Storage' },
        ],
    },
    {
        id: 'contact', label: 'Contact & Form',
        keys: [
            { key: 'contact_title', label: 'Section title' },
            { key: 'contact_cta_title', label: 'CTA title' },
            { key: 'contact_cta_text', label: 'CTA text' },
            { key: 'contact_cta_btn', label: 'CTA button' },
            { key: 'contact_address', label: 'Address label' },
            { key: 'address_line_1', label: 'Address line 1' },
            { key: 'address_line_2', label: 'Address line 2' },
            { key: 'contact_phone', label: 'Phone label' },
            { key: 'contact_email', label: 'Email label' },
            { key: 'contact_website', label: 'Website label' },
            { key: 'form_name', label: 'Name field label' },
            { key: 'form_name_placeholder', label: 'Name placeholder' },
            { key: 'form_email', label: 'Email field label' },
            { key: 'form_email_placeholder', label: 'Email placeholder' },
            { key: 'form_email_error', label: 'Email required error' },
            { key: 'form_email_invalid', label: 'Email invalid error' },
            { key: 'form_comment', label: 'Comment field label' },
            { key: 'form_submit', label: 'Submit button' },
            { key: 'form_sending', label: 'Sending state' },
            { key: 'form_success', label: 'Success message' },
            { key: 'form_error', label: 'Error message' },
            { key: 'social_msg_product', label: 'Social message (product)' },
            { key: 'social_msg_general', label: 'Social message (general)' },
        ],
    },
    {
        id: 'certs', label: 'Certificates',
        keys: [
            { key: 'certificates_title', label: 'Section title' },
            { key: 'documentation_label', label: 'Small label' },
            { key: 'cert_1', label: 'Certificate 1' },
            { key: 'cert_2', label: 'Certificate 2' },
            { key: 'cert_3', label: 'Certificate 3' },
            { key: 'cert_4', label: 'Certificate 4' },
        ],
    },
    {
        id: 'gallery', label: 'Gallery & Partners',
        keys: [
            { key: 'gallery_title', label: 'Gallery title' },
            { key: 'gallery_item_alt', label: 'Image Alt Text' },
            { key: 'partners_label', label: 'Partners small label' },
            { key: 'partners_title', label: 'Partners title' },
            { key: 'partner_alt', label: 'Partner Alt Text' },
        ],
    },
    {
        id: 'footer', label: 'Footer',
        keys: [
            { key: 'footer_slogan', label: 'Slogan' },
            { key: 'footer_quick_links', label: 'Quick links heading' },
            { key: 'footer_contact_us', label: 'Contact us heading' },
            { key: 'footer_rights', label: 'Rights text' },
        ],
    },
    {
        id: 'quote', label: 'Quote Cart',
        keys: [
            { key: 'quote_add', label: 'Add to quote button' },
            { key: 'quote_added', label: 'Added state' },
            { key: 'quote_cart_title', label: 'Cart title' },
            { key: 'quote_empty', label: 'Empty state' },
            { key: 'quote_qty_placeholder', label: 'Quantity placeholder' },
            { key: 'quote_remove', label: 'Remove button' },
            { key: 'quote_clear', label: 'Clear list button' },
            { key: 'quote_company', label: 'Company field label' },
            { key: 'quote_submit', label: 'Submit button' },
            { key: 'quote_success', label: 'Success message' },
        ],
    },
    {
        id: 'modals', label: 'Price Modal',
        keys: [
            { key: 'modal_price_title', label: 'Price request title' },
            { key: 'modal_info_title', label: 'Info request title' },
            { key: 'modal_phone', label: 'Phone label' },
            { key: 'modal_phone_error', label: 'Phone required error' },
            { key: 'modal_phone_invalid', label: 'Phone invalid error' },
            { key: 'modal_quantity', label: 'Quantity label' },
            { key: 'modal_quantity_error', label: 'Quantity error' },
            { key: 'modal_quantity_placeholder', label: 'Quantity placeholder' },
            { key: 'modal_comment_placeholder', label: 'Comment placeholder' },
            { key: 'modal_submit', label: 'Submit button' },
            { key: 'modal_success_title', label: 'Success title' },
            { key: 'modal_success', label: 'Success message' },
            { key: 'modal_error', label: 'Error message' },
        ],
    },
    {
        id: 'seo', label: 'SEO & Meta',
        keys: [
            { key: 'meta_title', label: 'Home meta title' },
            { key: 'meta_description', label: 'Home meta description', multiline: true },
            { key: 'meta_keywords', label: 'Home meta keywords' },
            { key: 'og_title', label: 'OG title' },
            { key: 'og_description', label: 'OG description', multiline: true },
            { key: 'schema_description', label: 'Schema description', multiline: true },
            { key: 'products_meta_title', label: 'Products page title' },
            { key: 'products_meta_desc', label: 'Products page desc', multiline: true },
            { key: 'about_meta_title', label: 'About page title' },
            { key: 'about_meta_desc', label: 'About page desc', multiline: true },
            { key: 'contact_meta_title', label: 'Contact page title' },
            { key: 'contact_meta_desc', label: 'Contact page desc', multiline: true },
            { key: 'notfound_heading', label: '404 heading' },
            { key: 'notfound_text', label: '404 text' },
            { key: 'notfound_home', label: '404 home link' },
        ],
    },
];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { refreshTranslations } = useLanguage();
    const { tab: tabParam, productSlug } = useParams();
    const tab = tabParam || (productSlug ? 'products' : 'dashboard');
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Products state
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFeatured, setFilterFeatured] = useState(false);
    const [productForm, setProductForm] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [productSaving, setProductSaving] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({});
    const [settingsSaving, setSettingsSaving] = useState(false);

    // Translations / Languages state
    const [adminTranslations, setAdminTranslations] = useState(SEED_TRANSLATIONS);
    const [translationsSaving, setTranslationsSaving] = useState(false);
    const [translationsDirty, setTranslationsDirty] = useState(false);
    const [transLangTab, setTransLangTab] = useState('');
    const [prodLangTab, setProdLangTab] = useState('');
    const [openGroups, setOpenGroups] = useState({});
    const [openSpecSections, setOpenSpecSections] = useState({ identity: true, physical: true, quality: false, microbiology: false, storage: false, documents: false });
    const toggleSpecSection = id => setOpenSpecSections(p => ({ ...p, [id]: !p[id] }));
    const [newLangForm, setNewLangForm] = useState({ code: '', label: '', name: '' });
    const [showAddLangModal, setShowAddLangModal] = useState(false);
    const [newDocInput, setNewDocInput] = useState('');

    // Inquiries state
    const [inquiries, setInquiries] = useState([]);
    const [expandedInquiry, setExpandedInquiry] = useState(null);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [inqFilter, setInqFilter] = useState('all');
    const [inqSearch, setInqSearch] = useState('');
    const [productsPage, setProductsPage] = useState(0);
    const [inqPage, setInqPage] = useState(0);
    const [statsPvPage, setStatsPvPage] = useState(0);
    const [statsAllPage, setStatsAllPage] = useState(0);

    // Stats state
    const [stats, setStats] = useState({ total: 0, paths: {} });
    const [statsLoading, setStatsLoading] = useState(false);

    // Gallery state
    const [gallery, setGallery] = useState([]);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [galleryDragging, setGalleryDragging] = useState(false);
    const [galleryUploadProgress, setGalleryUploadProgress] = useState({ done: 0, total: 0 });
    const [galleryLightbox, setGalleryLightbox] = useState(null);
    const galleryInputRef = useRef();

    // Seed state
    const [seeding, setSeeding] = useState(false);
    const [seedMsg, setSeedMsg] = useState('');
    const [chartHoverIndex, setChartHoverIndex] = useState(null);

    // Custom confirm state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        isDanger: false,
        typeToConfirm: '',
    });
    const [confirmInput, setConfirmInput] = useState('');

    const [colWidths, setColWidths] = useState({
        type: 90,
        name: 150,
        email: 180,
        details: 350,
        date: 130,
    });

    const startResize = (e, colKey) => {
        e.preventDefault();
        const startX = e.pageX;
        const startWidth = colWidths[colKey];

        const handleMouseMove = (moveEvent) => {
            const currentWidth = startWidth + (moveEvent.pageX - startX);
            setColWidths(prev => ({
                ...prev,
                [colKey]: Math.max(50, currentWidth)
            }));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const [toast, setToast] = useState('');
    const fileInputRef = useRef();

    useEffect(() => {
        return onAuth(user => {
            if (!user) navigate('/admin/login', { replace: true });
            else setUser(user);
            setAuthChecked(true);
        });
    }, [navigate]);

    useEffect(() => {
        if (!user) return;
        loadData();
    }, [user]);

    useEffect(() => { setProductsPage(0); }, [searchTerm, filterFeatured]);
    useEffect(() => { setInqPage(0); }, [inqFilter, inqSearch]);

    useEffect(() => {
        if (!productSlug) {
            setEditingProduct(null);
            setIsAdding(false);
            setProductForm({});
            return;
        }
        if (productSlug === 'new') {
            if (!isAdding) {
                setIsAdding(true);
                setEditingProduct(null);
                setProdLangTab(firstLangCode());
                setNewDocInput('');
                const langs = adminTranslations.languages || [{ code: 'ru' }, { code: 'en' }];
                const defaults = { botanical_name: 'Glycyrrhiza glabra', origin: 'Uzbekistan', part_used: 'Root', cultivation: 'Wild + artificial', form_cut_type: '', cut_size: '', diameter_grade: '', processing: '', packaging: 'PP bags 25 kg', moq: '', moisture: '≤ 8%', ash: '≤ 9%', glycyrrhizin: '', foreign_matter: '≤ 1%', heavy_metals: 'Within WHO/EU limits', pesticide_residues: 'Within WHO/EU limits', tpc: '≤ 100,000 CFU/g', yeast_mould: '≤ 1,000 CFU/g', e_coli: 'Absent', salmonella: 'Absent', shelf_life: '24 months', storage: '≤ 25°C, cool dry, no sunlight', documents: [] };
                const s = {}; langs.forEach(l => { s[l.code] = { ...defaults }; });
                const langFields = {}; langs.forEach(l => { langFields[`title_${l.code}`] = ''; langFields[`desc_${l.code}`] = ''; });
                setProductForm({ slug: '', ...langFields, featured: false, order: products.length > 0 ? Math.max(...products.map(p => p.order || 0)) + 1 : 1, image: '', specs: s });
                setImageFile(null); setImagePreview('');
            }
            return;
        }
        if (editingProduct !== productSlug && products.length > 0) {
            const product = products.find(p => p.slug === productSlug);
            if (product) {
                const langs = adminTranslations.languages || [{ code: 'ru' }, { code: 'en' }];
                let specs = product.specs || {};
                const isFlat = !langs.some(l => specs[l.code] && typeof specs[l.code] === 'object');
                if (isFlat) { const { documents, ...flat } = specs; const n = {}; langs.forEach(l => { n[l.code] = { ...flat, documents: documents || [] }; }); specs = n; }
                setEditingProduct(product.slug);
                setIsAdding(false);
                setProductForm({ ...product, specs });
                setProdLangTab(firstLangCode());
                setNewDocInput('');
                setImageFile(null);
                setImagePreview(product.image);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productSlug, products]);

    const setTabPersist = (t) => {
        setSelectedInquiry(null);
        setExpandedInquiry(null);
        navigate('/admin/' + t);
    };

    const loadData = async () => {
        setDataLoading(true);
        try {
            const [prodsR, setsR, inqsR, statsR, transR] = await Promise.allSettled([
                fetchProducts(), fetchSettings(), fetchInquiries(), fetchStats(), fetchTranslations(),
            ]);
            const prods = prodsR.status === 'fulfilled' ? (prodsR.value || []) : [];
            const sets  = setsR.status  === 'fulfilled' ? (setsR.value  || {}) : {};
            const inqs  = inqsR.status  === 'fulfilled' ? (inqsR.value  || []) : [];
            const sts   = statsR.status === 'fulfilled' ? (statsR.value || { total: 0, paths: {} }) : { total: 0, paths: {} };
            const trans = transR.status === 'fulfilled' && transR.value ? transR.value : SEED_TRANSLATIONS;
            setProducts(prods);
            setSettings(sets);
            setInquiries(inqs);
            setStats(sts);
            setGallery(sets.gallery || []);
            setAdminTranslations(trans);
            setTranslationsDirty(false);
            setTransLangTab(trans.languages?.[0]?.code || 'ru');
            const failures = [prodsR, setsR, inqsR, statsR, transR].filter(r => r.status === 'rejected');
            if (failures.length) showToast(`Warning: ${failures.length} data source(s) failed to load. Check console.`);
            failures.forEach(r => console.error('[loadData]', r.reason));
        } finally {
            setDataLoading(false);
        }
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    // ── Products ──────────────────────────────────────────────────────────────

    const firstLangCode = () => adminTranslations.languages?.[0]?.code || 'ru';

    const startEdit = (product) => {
        savedScrollY.current = window.scrollY;
        navigate('/admin/products/' + product.slug);
        const langs = adminTranslations.languages || [{ code: 'ru' }, { code: 'en' }];
        let specs = product.specs || {};
        const isFlat = !langs.some(l => specs[l.code] && typeof specs[l.code] === 'object');
        if (isFlat) {
            const { documents, ...flatFields } = specs;
            const nested = {};
            langs.forEach(l => { nested[l.code] = { ...flatFields, documents: documents || [] }; });
            specs = nested;
        }
        setEditingProduct(product.slug);
        setIsAdding(false);
        setProductForm({ ...product, specs });
        setProdLangTab(firstLangCode());
        setNewDocInput('');
        setImageFile(null);
        setImagePreview(product.image);
    };

    const startAdd = () => {
        navigate('/admin/products/new');
        setIsAdding(true);
        setEditingProduct(null);
        setProdLangTab(firstLangCode());
        setNewDocInput('');
        const langs = adminTranslations.languages || [{ code: 'ru' }, { code: 'en' }];
        const langFields = {};
        langs.forEach(lang => {
            langFields[`title_${lang.code}`] = '';
            langFields[`desc_${lang.code}`] = '';
        });
        setProductForm({
            slug: '',
            ...langFields,
            featured: false,
            order: products.length > 0 ? Math.max(...products.map(p => p.order || 0)) + 1 : 1,
            image: '',
            specs: (() => {
                const defaults = {
                    botanical_name: 'Glycyrrhiza glabra',
                    origin: 'Uzbekistan',
                    part_used: 'Root',
                    cultivation: 'Wild + artificial',
                    form_cut_type: '',
                    cut_size: '',
                    diameter_grade: '',
                    processing: '',
                    packaging: 'PP bags 25 kg',
                    moq: '',
                    moisture: '≤ 8%',
                    ash: '≤ 9%',
                    glycyrrhizin: '',
                    foreign_matter: '≤ 1%',
                    heavy_metals: 'Within WHO/EU limits',
                    pesticide_residues: 'Within WHO/EU limits',
                    tpc: '≤ 100,000 CFU/g',
                    yeast_mould: '≤ 1,000 CFU/g',
                    e_coli: 'Absent',
                    salmonella: 'Absent',
                    shelf_life: '24 months',
                    storage: '≤ 25°C, cool dry, no sunlight',
                    documents: [],
                };
                const s = {};
                langs.forEach(l => { s[l.code] = { ...defaults }; });
                return s;
            })(),
        });
        setImageFile(null);
        setImagePreview('');
    };

    const savedScrollY = useRef(0);
    const pendingScrollY = useRef(null);

    useLayoutEffect(() => {
        if (pendingScrollY.current !== null) {
            window.scrollTo({ top: pendingScrollY.current, behavior: 'instant' });
            pendingScrollY.current = null;
        }
    }, [editingProduct]);

    const cancelEdit = (restoreScroll = false) => {
        if (restoreScroll) pendingScrollY.current = savedScrollY.current;
        setEditingProduct(null);
        setIsAdding(false);
        setProductForm({});
        setImageFile(null);
        setImagePreview('');
        if (restoreScroll) navigate('/admin/products');
    };

    const handleSpecChange = (key, value) => {
        setProductForm(p => ({
            ...p,
            specs: {
                ...p.specs,
                [prodLangTab]: { ...(p.specs?.[prodLangTab] || {}), [key]: value },
            },
        }));
    };


    // ── Translations ──────────────────────────────────────────────────────────

    const handleTranslationChange = (langCode, key, value) => {
        setTranslationsDirty(true);
        setAdminTranslations(prev => ({
            ...prev,
            [langCode]: { ...(prev[langCode] || {}), [key]: value },
        }));
    };

    const saveTranslationsData = async () => {
        setTranslationsSaving(true);
        try {
            await saveTranslations(adminTranslations);
            await refreshTranslations();
            setTranslationsDirty(false);
            showToast('Translations saved.');
        } catch {
            showToast('Error saving translations.');
        } finally {
            setTranslationsSaving(false);
        }
    };

    const addLanguage = async () => {
        const code = newLangForm.code.trim().toLowerCase();
        const label = newLangForm.label.trim().toUpperCase();
        const name = newLangForm.name.trim();
        if (!code || !label || !name) { showToast('Fill in code, label, and name.'); return; }
        if (adminTranslations.languages?.some(l => l.code === code)) { showToast('Language code already exists.'); return; }
        const newLangs = [...(adminTranslations.languages || []), { code, label, name }];
        const enStrings = adminTranslations.en || SEED_TRANSLATIONS.en || {};
        const next = {
            ...adminTranslations,
            languages: newLangs,
            [code]: { ...enStrings },
        };
        setAdminTranslations(next);
        setTransLangTab(code);
        setNewLangForm({ code: '', label: '', name: '' });
        setShowAddLangModal(false);
        try {
            await saveTranslations(next);
            await refreshTranslations();
            showToast(`Language "${name}" added. Translate the strings then save.`);
        } catch {
            showToast(`Language "${name}" added locally but failed to save. Click "Save All".`);
        }
    };

    const removeLanguage = (code) => {
        if (adminTranslations.languages?.length <= 1) { showToast('Cannot remove the last language.'); return; }
        const newLangs = (adminTranslations.languages || []).filter(l => l.code !== code);
        setTranslationsDirty(true);
        setAdminTranslations(prev => {
            const next = { ...prev, languages: newLangs };
            delete next[code];
            return next;
        });
        if (transLangTab === code) setTransLangTab(newLangs[0]?.code || '');
    };

    const toggleGroup = (id) => setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const saveProductEdit = async () => {
        if (isAdding && !productForm.slug) {
            showToast('Slug is required for new products.');
            return;
        }

        if (isAdding && products.some(p => p.slug === productForm.slug)) {
            showToast('A product with this slug already exists.');
            return;
        }

        setProductSaving(true);
        try {
            let imageUrl = productForm.image;

            if (imageFile) {
                imageUrl = await uploadProductImage(productForm.slug, imageFile);
            } else if (isAdding && !imageUrl) {
                // If adding and no image, maybe use a placeholder
                imageUrl = '/images/placeholder.png';
            }

            const updated = { ...productForm, image: imageUrl };
            await saveProduct(updated);

            if (isAdding) {
                setProducts(prev => [...prev, updated].sort((a, b) => (a.order || 0) - (b.order || 0)));
            } else {
                setProducts(prev => prev.map(p => p.slug === updated.slug ? updated : p));
            }

            cancelEdit(!isAdding);
            showToast(isAdding ? 'Product added.' : 'Product saved.');
        } catch (err) {
            console.error(err);
            showToast('Error saving product.');
        } finally {
            setProductSaving(false);
        }
    };

    const moveProduct = async (product, dir) => {
        const sorted = [...products].sort((a, b) => (a.order || 0) - (b.order || 0));
        const idx = sorted.findIndex(p => p.slug === product.slug);
        const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;

        const a = sorted[idx];
        const b = sorted[swapIdx];
        const newA = { ...a, order: b.order };
        const newB = { ...b, order: a.order };

        setProducts(prev =>
            prev.map(p => (p.slug === a.slug ? newA : p.slug === b.slug ? newB : p))
                .sort((x, y) => (x.order || 0) - (y.order || 0))
        );
        try {
            await Promise.all([saveProduct(newA), saveProduct(newB)]);
        } catch {
            showToast('Error reordering.');
            loadData();
        }
    };

    const toggleFeatured = async (product) => {
        const updated = { ...product, featured: !product.featured };
        setProducts(prev => prev.map(p => (p.slug === product.slug ? updated : p)));
        try {
            await saveProduct(updated);
            showToast(updated.featured ? 'Added to Home (featured).' : 'Removed from Home.');
        } catch {
            setProducts(prev => prev.map(p => (p.slug === product.slug ? product : p)));
            showToast('Error updating product.');
        }
    };

    const handleDeleteProduct = async (product) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Product',
            message: `Are you sure you want to delete "${product.title_en || product.slug}"? This action cannot be undone.`,
            isDanger: true,
            onConfirm: async () => {
                try {
                    await deleteProduct(product.slug);
                    setProducts(prev => prev.filter(p => p.slug !== product.slug));
                    showToast('Product deleted.');
                } catch (err) {
                    console.error(err);
                    showToast('Error deleting product.');
                }
            }
        });
    };

    const filteredProducts = products.filter(p => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
            p.title_en?.toLowerCase().includes(q) ||
            p.title_ru?.toLowerCase().includes(q) ||
            p.slug?.toLowerCase().includes(q);
        const matchesFeatured = !filterFeatured || p.featured;
        return matchesSearch && matchesFeatured;
    });

    // Reorder is only meaningful on the full, unfiltered list.
    const canReorder = !searchTerm && !filterFeatured;

    // ── Settings ──────────────────────────────────────────────────────────────

    const handleSettingsChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handlePhoneChange = (index, value) => {
        const phones = [...(settings.phone || [])];
        phones[index] = value;
        setSettings(prev => ({ ...prev, phone: phones }));
    };

    const saveSettingsData = async () => {
        setSettingsSaving(true);
        try {
            await saveSettings(settings);
            showToast('Settings saved.');
        } catch {
            showToast('Error saving settings.');
        } finally {
            setSettingsSaving(false);
        }
    };

    // ── Inquiries ─────────────────────────────────────────────────────────────

    const openInquiry = async (inq) => {
        setSelectedInquiry(inq);
        if (!inq.read) {
            await markInquiryRead(inq.id);
            setInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, read: true } : i));
            setSelectedInquiry(prev => prev ? { ...prev, read: true } : prev);
        }
    };

    const closeInquiry = () => setSelectedInquiry(null);

    const handleMarkRead = async (id) => {
        await markInquiryRead(id);
        setInquiries(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
    };

    const markAllRead = async () => {
        const unread = inquiries.filter(i => !i.read);
        if (unread.length === 0) return;
        setInquiries(prev => prev.map(i => ({ ...i, read: true })));
        try {
            await Promise.all(unread.map(i => markInquiryRead(i.id)));
            showToast('All inquiries marked as read.');
        } catch {
            showToast('Error updating inquiries.');
            loadData();
        }
    };

    const handleDeleteInquiry = (inq) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Inquiry',
            message: `Delete the inquiry from "${inq.name || inq.email}"? This cannot be undone.`,
            isDanger: true,
            onConfirm: async () => {
                try {
                    await deleteInquiry(inq.id);
                    setInquiries(prev => prev.filter(i => i.id !== inq.id));
                    if (selectedInquiry?.id === inq.id) closeInquiry();
                    showToast('Inquiry deleted.');
                } catch {
                    showToast('Error deleting inquiry.');
                }
            },
        });
    };

    const unreadCount = inquiries.filter(i => !i.read).length;

    const filteredInquiries = inquiries.filter(i => {
        const matchesFilter =
            inqFilter === 'all' ? true :
            inqFilter === 'unread' ? !i.read :
            (i.type || 'contact') === inqFilter;
        const q = inqSearch.toLowerCase();
        const matchesSearch = !q ||
            i.name?.toLowerCase().includes(q) ||
            i.email?.toLowerCase().includes(q) ||
            i.product?.toLowerCase().includes(q) ||
            i.message?.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const PRODUCTS_PER_PAGE = 10;
    const INQ_PER_PAGE = 10;
    const productsTotalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    const inqTotalPages = Math.ceil(filteredInquiries.length / INQ_PER_PAGE);
    const pagedProducts = filteredProducts.slice(productsPage * PRODUCTS_PER_PAGE, (productsPage + 1) * PRODUCTS_PER_PAGE);
    const pagedInquiries = filteredInquiries.slice(inqPage * INQ_PER_PAGE, (inqPage + 1) * INQ_PER_PAGE);

    // ── Gallery ───────────────────────────────────────────────────────────────

    const handleGalleryUpload = async (files) => {
        const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!fileArr.length) return;

        setGalleryUploading(true);
        setGalleryUploadProgress({ done: 0, total: fileArr.length });
        let current = [...gallery];
        let failed = 0;

        for (const file of fileArr) {
            try {
                const url = await uploadGalleryImage(file);
                current = [...current, url];
                setGallery(current);
                setGalleryUploadProgress(p => ({ ...p, done: p.done + 1 }));
            } catch (err) {
                console.error('Upload error:', err);
                failed++;
            }
        }

        try {
            await saveSettings({ ...settings, gallery: current });
        } catch (err) {
            console.error('Save gallery error:', err);
        }

        setGalleryUploading(false);
        setGalleryUploadProgress({ done: 0, total: 0 });
        if (galleryInputRef.current) galleryInputRef.current.value = '';

        if (failed > 0) showToast(`${failed} image(s) failed to upload.`);
        else showToast(`${fileArr.length} image(s) added to gallery.`);
    };

    const removeGalleryImage = (index) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove Image',
            message: 'Remove this image from the gallery?',
            isDanger: true,
            onConfirm: async () => {
                const updated = gallery.filter((_, i) => i !== index);
                setGallery(updated);
                try {
                    await saveSettings({ ...settings, gallery: updated });
                    showToast('Image removed.');
                } catch {
                    showToast('Error removing image.');
                    loadData();
                }
            },
        });
    };

    // ── Seed ──────────────────────────────────────────────────────────────────

    const handleSeed = async () => {
        const seeded = await isDatabaseSeeded();
        if (seeded) {
            setSeedMsg('Database already has data. Seeding would overwrite it.');
            return;
        }
        setSeeding(true);
        try {
            await seedDatabase();
            await loadData();
            showToast('Database seeded from defaults.');
            setSeedMsg('');
        } catch {
            showToast('Seed failed.');
        } finally {
            setSeeding(false);
        }
    };

    const forceSeed = () => {
        setConfirmInput('');
        setConfirmModal({
            isOpen: true,
            title: 'Re-seed Database',
            message: 'This will permanently overwrite all products, settings, and content with built-in defaults. Type DELETE to confirm.',
            isDanger: true,
            typeToConfirm: 'DELETE',
            onConfirm: async () => {
                setSeeding(true);
                try {
                    await seedDatabase();
                    await loadData();
                    showToast('Database re-seeded.');
                    setSeedMsg('');
                } catch {
                    showToast('Seed failed.');
                } finally {
                    setSeeding(false);
                }
            }
        });
    };

    // ── Dashboard analytics (derived) ──────────────────────────────────────────
    const inqDate = (inq) => {
        const v = inq.createdAt || inq.timestamp;
        if (!v) return null;
        if (typeof v.toDate === 'function') return v.toDate();
        const d = new Date(v);
        return isNaN(d) ? null : d;
    };

    const last30Days = useMemo(() => {
        const now = new Date();
        const locale = navigator.language || 'ru-RU';

        // Find earliest inquiry date to avoid showing empty leading days
        let earliest = null;
        inquiries.forEach(inq => {
            const ts = inqDate(inq);
            if (ts && (!earliest || ts < earliest)) earliest = ts;
        });

        // Start 2 days before first inquiry, minimum 7-day window
        const startOffset = earliest
            ? Math.min(29, Math.max(6, Math.ceil((now - earliest) / 86400000) + 2))
            : 13;

        const days = [];
        for (let i = startOffset; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const fullDate = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
            days.push({ key, label: `${d.getDate()}/${d.getMonth() + 1}`, fullDate, count: 0 });
        }
        const map = Object.fromEntries(days.map(d => [d.key, d]));
        inquiries.forEach(inq => {
            const ts = inqDate(inq);
            if (ts) {
                const k = ts.toISOString().slice(0, 10);
                if (map[k]) map[k].count++;
            }
        });
        return days;
    }, [inquiries]);

    const typeBreakdown = useMemo(() => {
        const t = { contact: 0, price: 0, quote: 0 };
        inquiries.forEach(i => { const ty = i.type || 'contact'; t[ty] = (t[ty] || 0) + 1; });
        return t;
    }, [inquiries]);

    const topProducts = useMemo(() => {
        const m = {};
        inquiries.forEach(i => {
            if (i.product) m[i.product] = (m[i.product] || 0) + 1;
            if (Array.isArray(i.items)) i.items.forEach(it => { if (it.title) m[it.title] = (m[it.title] || 0) + 1; });
        });
        return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [inquiries]);

    const topPages = useMemo(() =>
        Object.entries(stats.paths || {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([path, count]) => ({
                label: path === 'home' ? '/' : '/' + path.replace(/_/g, '/'),
                count,
            })),
        [stats]);

    const recentInquiries = useMemo(() =>
        [...inquiries]
            .sort((a, b) => (inqDate(b)?.getTime() || 0) - (inqDate(a)?.getTime() || 0))
            .slice(0, 5),
        [inquiries]);

    const pageStats = useMemo(() => {
        const entries = Object.entries(stats.paths || {});
        const all = entries
            .map(([path, count]) => ({
                path,
                label: path === 'home' ? '/' : '/' + path.replace(/_/g, '/'),
                count,
            }))
            .sort((a, b) => b.count - a.count);
        const productViews = entries
            .filter(([p]) => p.startsWith('products_'))
            .map(([p, count]) => {
                const slug = p.slice('products_'.length);
                // docId is always the slug; .slug field may be absent on old docs
                const prod = products.find(x => (x.slug || x.docId) === slug);
                return { slug, title: prod ? (prod.title_en || prod.title_ru || slug) : slug, count };
            })
            .sort((a, b) => b.count - a.count);
        return { all, productViews };
    }, [stats, products]);

    const totalViews = useMemo(() => {
        const sum = Object.values(stats.paths || {}).reduce((s, v) => s + v, 0);
        return sum || stats.total || 0;
    }, [stats]);

    const maxDay = Math.max(1, ...last30Days.map(d => d.count));
    const inqTotal = typeBreakdown.contact + typeBreakdown.price + typeBreakdown.quote;
    const pct = (n) => (inqTotal ? Math.round((n / inqTotal) * 100) : 0);
    const donutStyle = inqTotal === 0
        ? { background: '#ececec' }
        : {
            background: `conic-gradient(#a3a3a3 0 ${pct(typeBreakdown.contact)}%, #8B9A65 0 ${pct(typeBreakdown.contact) + pct(typeBreakdown.price)}%, #515E3B 0 100%)`,
        };

    if (!authChecked) return null;

    return (
        <div className="admin-dashboard">
            {/* Add Language Modal */}
            {showAddLangModal && (
                <div className="admin-modal-overlay" onClick={() => setShowAddLangModal(false)}>
                    <div className="admin-confirm-modal admin-add-lang-modal" onClick={e => e.stopPropagation()}>
                        <h3>Add New Language</h3>
                        <p style={{ color: '#8a8576', fontSize: '0.875rem', margin: '0 0 20px' }}>
                            New language inherits English strings as a starting point.
                        </p>
                        <div className="admin-field">
                            <label>Code <span className="admin-field-hint">2-letter ISO, e.g. uz</span></label>
                            <input
                                autoFocus
                                value={newLangForm.code}
                                onChange={e => setNewLangForm(f => ({ ...f, code: e.target.value }))}
                                placeholder="uz"
                                maxLength={5}
                                onKeyDown={e => e.key === 'Enter' && addLanguage()}
                            />
                        </div>
                        <div className="admin-field">
                            <label>Label <span className="admin-field-hint">shown in navbar</span></label>
                            <input
                                value={newLangForm.label}
                                onChange={e => setNewLangForm(f => ({ ...f, label: e.target.value }))}
                                placeholder="UZ"
                                maxLength={5}
                                onKeyDown={e => e.key === 'Enter' && addLanguage()}
                            />
                        </div>
                        <div className="admin-field">
                            <label>Name <span className="admin-field-hint">full language name</span></label>
                            <input
                                value={newLangForm.name}
                                onChange={e => setNewLangForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="O'zbek"
                                onKeyDown={e => e.key === 'Enter' && addLanguage()}
                            />
                        </div>
                        <div className="admin-confirm-actions" style={{ marginTop: 24 }}>
                            <button className="admin-btn-secondary" onClick={() => setShowAddLangModal(false)}>Cancel</button>
                            <button className="admin-btn-primary" onClick={addLanguage}>Add Language</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="admin-modal-overlay" onClick={() => { setConfirmModal({ ...confirmModal, isOpen: false }); setConfirmInput(''); }}>
                    <div className="admin-confirm-modal" onClick={e => e.stopPropagation()}>
                        <h3>{confirmModal.title}</h3>
                        <p>{confirmModal.message}</p>
                        {confirmModal.typeToConfirm && (
                            <input
                                className="admin-confirm-input"
                                type="text"
                                placeholder={`Type ${confirmModal.typeToConfirm} to confirm`}
                                value={confirmInput}
                                onChange={e => setConfirmInput(e.target.value)}
                                autoFocus
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && confirmInput === confirmModal.typeToConfirm) {
                                        confirmModal.onConfirm();
                                        setConfirmModal({ ...confirmModal, isOpen: false });
                                        setConfirmInput('');
                                    }
                                }}
                            />
                        )}
                        <div className="admin-confirm-actions">
                            <button
                                className="admin-btn-secondary"
                                onClick={() => { setConfirmModal({ ...confirmModal, isOpen: false }); setConfirmInput(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                className={confirmModal.isDanger ? 'admin-btn-danger' : 'admin-btn-primary'}
                                disabled={confirmModal.typeToConfirm ? confirmInput !== confirmModal.typeToConfirm : false}
                                onClick={() => {
                                    confirmModal.onConfirm();
                                    setConfirmModal({ ...confirmModal, isOpen: false });
                                    setConfirmInput('');
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <img src="/Logo/new-logo.png" alt="Bogot Master" className="admin-logo-sm" />
                    <span>Admin Panel</span>
                </div>
                <button
                    className="admin-btn-secondary"
                    onClick={() => signOut()}
                >
                    Sign Out
                </button>
            </header>

            {/* Toast */}
            {toast && <div className="admin-toast">{toast}</div>}

            <div className="admin-body">
                {/* Sidebar */}
                <aside className="admin-sidebar">
                    <span className="admin-sidebar-label">Management</span>
                    <div className="admin-sidebar-menu">
                        <button
                            className={`admin-tab-btn ${tab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setTabPersist('dashboard')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            <span>Dashboard</span>
                        </button>
                        <button
                            className={`admin-tab-btn ${tab === 'products' ? 'active' : ''}`}
                            onClick={() => setTabPersist('products')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            <span>Products</span>
                        </button>
                        <button
                            className={`admin-tab-btn ${tab === 'inquiries' ? 'active' : ''}`}
                            onClick={() => setTabPersist('inquiries')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            <span>Inquiries</span> {unreadCount > 0 && <span className="admin-unread-badge">{unreadCount}</span>}
                        </button>
                        <button
                            className={`admin-tab-btn ${tab === 'stats' ? 'active' : ''}`}
                            onClick={() => setTabPersist('stats')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                            <span>Stats</span>
                        </button>
                        <button
                            className={`admin-tab-btn ${tab === 'gallery' ? 'active' : ''}`}
                            onClick={() => setTabPersist('gallery')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            <span>Gallery</span>
                        </button>
                        <button
                            className={`admin-tab-btn ${tab === 'settings' ? 'active' : ''}`}
                            onClick={() => setTabPersist('settings')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            <span>Settings</span>
                        </button>
                        <button
                            className={`admin-tab-btn ${tab === 'languages' ? 'active' : ''}`}
                            onClick={() => setTabPersist('languages')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            <span>Languages</span>
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <main className="admin-main">

                    {/* ── Loading skeleton (tab-aware) ──────────────────────────── */}
                    {dataLoading && (tab === 'dashboard' || tab === 'products' || tab === 'inquiries' || tab === 'stats' || tab === 'gallery' || tab === 'settings') && (
                        <div className="admin-section">
                            {/* ── Loading Skeleton Header ── */}
                            {!(tab === 'inquiries') ? (
                                <div className="admin-skeleton-header">
                                    <div className="admin-skel admin-skel-title" />
                                    <div className="admin-skel admin-skel-btn" />
                                </div>
                            ) : selectedInquiry ? (
                                <div className="admin-section-header">
                                    <div className="admin-inq-detail-heading">
                                        <div className="admin-skel" style={{ height: 32, width: 140, borderRadius: 6 }} />
                                    </div>
                                    <div className="admin-inq-detail-actions">
                                        <div className="admin-skel" style={{ height: 32, width: 120, borderRadius: 6 }} />
                                        <div className="admin-skel" style={{ height: 32, width: 60, borderRadius: 6 }} />
                                    </div>
                                </div>
                            ) : (
                                <div className="admin-section-header">
                                    <div className="admin-skel admin-skel-title" style={{ width: 160 }} />
                                    <div className="admin-skel admin-skel-btn" style={{ width: 100 }} />
                                </div>
                            )}

                            {/* Dashboard skeleton */}
                            {tab === 'dashboard' && (<>
                                <div className="admin-stats-grid admin-stats-grid-5">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="admin-stat-card">
                                            <div className="admin-skel admin-skel-label" />
                                            <div className="admin-skel admin-skel-value" />
                                            <div className="admin-skel admin-skel-sub" />
                                        </div>
                                    ))}
                                </div>
                                <div className="admin-skel-cards">
                                    <div className="admin-skel admin-skel-card-tall" />
                                    <div className="admin-skel admin-skel-card" />
                                    <div className="admin-skel admin-skel-card" />
                                </div>
                            </>)}

                            {/* Products skeleton — list rows */}
                            {tab === 'products' && (
                                <div className="admin-products-list">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="admin-product-row admin-skel-row">
                                            <div className="admin-skel admin-skel-thumb" />
                                            <div className="admin-skel-row-info">
                                                <div className="admin-skel admin-skel-row-title" />
                                                <div className="admin-skel admin-skel-row-sub" />
                                            </div>
                                            <div className="admin-skel admin-skel-row-actions" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Inquiries skeleton — list or detail */}
                            {tab === 'inquiries' && (
                                selectedInquiry ? (
                                    /* Detail skeleton */
                                    <>
                                        <div className="admin-inq-detail-body" style={{ marginTop: 8 }}>
                                            {/* Left aside skeleton */}
                                            <div className="admin-inq-detail-aside">
                                                <div className="admin-skel" style={{ width: 64, height: 64, borderRadius: '50%' }} />
                                                <div className="admin-skel" style={{ height: 14, width: 120, borderRadius: 4, marginTop: 8 }} />
                                                <div className="admin-skel" style={{ height: 11, width: 80, borderRadius: 4 }} />
                                                <div style={{ width: '100%', borderTop: '1px solid #f0ede8', paddingTop: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    <div className="admin-skel" style={{ height: 12, width: '90%', borderRadius: 4 }} />
                                                    <div className="admin-skel" style={{ height: 12, width: '75%', borderRadius: 4 }} />
                                                    <div className="admin-skel" style={{ height: 12, width: '60%', borderRadius: 4 }} />
                                                </div>
                                            </div>
                                            {/* Right main skeleton */}
                                            <div className="admin-inq-detail-main">
                                                <div className="admin-inq-detail-card">
                                                    <div className="admin-skel" style={{ height: 10, width: 80, borderRadius: 4, marginBottom: 12 }} />
                                                    <div className="admin-skel" style={{ height: 16, width: '60%', borderRadius: 4 }} />
                                                    <div className="admin-skel" style={{ height: 12, width: '35%', borderRadius: 4, marginTop: 8 }} />
                                                </div>
                                                <div className="admin-inq-detail-card">
                                                    <div className="admin-skel" style={{ height: 10, width: 60, borderRadius: 4, marginBottom: 12 }} />
                                                    <div className="admin-skel" style={{ height: 13, width: '100%', borderRadius: 4 }} />
                                                    <div className="admin-skel" style={{ height: 13, width: '85%', borderRadius: 4, marginTop: 8 }} />
                                                    <div className="admin-skel" style={{ height: 13, width: '70%', borderRadius: 4, marginTop: 8 }} />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* List skeleton */
                                    <>
                                        <div className="admin-section-header" style={{ pointerEvents: 'none' }}>
                                            <div className="admin-skel" style={{ height: 22, width: 200, borderRadius: 6 }} />
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <div className="admin-skel" style={{ height: 34, width: 80, borderRadius: 8 }} />
                                            </div>
                                        </div>
                                        <div className="admin-list-controls" style={{ pointerEvents: 'none' }}>
                                            <div className="admin-skel" style={{ height: 40, width: '100%', borderRadius: 8 }} />
                                            <div className="admin-filter-chips" style={{ background: '#f0ede8' }}>
                                                {[52, 76, 74, 60, 62].map((w, i) => (
                                                    <div key={i} className="admin-skel" style={{ height: 30, width: w, borderRadius: 6, flexShrink: 0 }} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="admin-table-wrap">
                                            <table className="admin-table">
                                                <thead><tr>
                                                    <th style={{width:'90px'}}>Type</th>
                                                    <th>Name</th><th>Email</th><th>Details</th>
                                                    <th style={{width:'130px'}}>Date</th><th style={{width:'90px'}}></th>
                                                </tr></thead>
                                                <tbody>
                                                    {[...Array(6)].map((_, i) => (
                                                        <tr key={i}>
                                                            <td><div className="admin-skel" style={{height:22,width:56,borderRadius:4}}/></td>
                                                            <td><div className="admin-skel" style={{height:13,width:'80%',borderRadius:4}}/></td>
                                                            <td><div className="admin-skel" style={{height:13,width:'85%',borderRadius:4}}/></td>
                                                            <td><div className="admin-skel" style={{height:13,width:'60%',borderRadius:4}}/></td>
                                                            <td><div className="admin-skel" style={{height:13,width:72,borderRadius:4}}/></td>
                                                            <td><div className="admin-skel" style={{height:28,width:50,borderRadius:6}}/></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )
                            )}

                            {/* Stats skeleton — KPIs + two tall cards */}
                            {tab === 'stats' && (<>
                                <div className="admin-stats-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="admin-stat-card">
                                            <div className="admin-skel admin-skel-label" />
                                            <div className="admin-skel admin-skel-value" />
                                        </div>
                                    ))}
                                </div>
                                <div className="admin-skel admin-skel-card-tall" style={{marginTop:16}} />
                                <div className="admin-skel admin-skel-card-tall" style={{marginTop:12}} />
                            </>)}

                            {/* Gallery skeleton — upload bar + image grid */}
                            {tab === 'gallery' && (<>
                                <div className="admin-skeleton-header">
                                    <div className="admin-skel admin-skel-title" style={{ width: 180 }} />
                                    <div className="admin-skel admin-skel-btn" style={{ width: 140 }} />
                                </div>
                                <div className="admin-skel" style={{ height: 100, borderRadius: 12, marginBottom: 20 }} />
                                <div className="admin-gallery-grid">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="admin-skel" style={{ aspectRatio: '1', borderRadius: 8 }} />
                                    ))}
                                </div>
                            </>)}

                            {/* Settings skeleton — section cards with field rows */}
                            {tab === 'settings' && (<>
                                <div className="admin-skeleton-header">
                                    <div className="admin-skel admin-skel-title" style={{ width: 120 }} />
                                    <div className="admin-skel admin-skel-btn" style={{ width: 130 }} />
                                </div>
                                {[...Array(3)].map((_, ci) => (
                                    <div key={ci} className="admin-settings-card" style={{ marginBottom: 16 }}>
                                        <div className="admin-settings-card-head">
                                            <div className="admin-skel" style={{ height: 16, width: 16, borderRadius: 4 }} />
                                            <div className="admin-skel" style={{ height: 16, width: 160, borderRadius: 4 }} />
                                        </div>
                                        <div className="admin-fields-row" style={{ marginTop: 16 }}>
                                            <div className="admin-field">
                                                <div className="admin-skel" style={{ height: 12, width: 60, borderRadius: 4, marginBottom: 8 }} />
                                                <div className="admin-skel" style={{ height: 36, borderRadius: 6 }} />
                                            </div>
                                            <div className="admin-field">
                                                <div className="admin-skel" style={{ height: 12, width: 60, borderRadius: 4, marginBottom: 8 }} />
                                                <div className="admin-skel" style={{ height: 36, borderRadius: 6 }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>)}
                        </div>
                    )}

                    {/* ── Tab content (hidden while loading) ────────────────────── */}
                    {/* ── Dashboard tab ─────────────────────────────────────────── */}
                    {!dataLoading && tab === 'dashboard' && (
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <h2>Dashboard Overview</h2>
                            </div>

                            {/* KPI cards */}
                            <div className="admin-stats-grid admin-stats-grid-5">
                                <div className="admin-stat-card">
                                    <span className="admin-stat-label">Total Products</span>
                                    <span className="admin-stat-value">{products.length}</span>
                                    <span className="admin-stat-sub">{products.filter(p => p.featured).length} featured</span>
                                </div>
                                <div className="admin-stat-card">
                                    <span className="admin-stat-label">Inquiries</span>
                                    <span className="admin-stat-value">{inquiries.length}</span>
                                    <span className="admin-stat-sub">{unreadCount} unread</span>
                                </div>
                                <div className="admin-stat-card">
                                    <span className="admin-stat-label">Quote Requests</span>
                                    <span className="admin-stat-value">{typeBreakdown.quote}</span>
                                    <span className="admin-stat-sub">multi-product</span>
                                </div>
                                <div className="admin-stat-card">
                                    <span className="admin-stat-label">Total Visits</span>
                                    <span className="admin-stat-value">{totalViews.toLocaleString()}</span>
                                    <span className="admin-stat-sub">all pages</span>
                                </div>
                                <div className="admin-stat-card">
                                    <span className="admin-stat-label">Gallery</span>
                                    <span className="admin-stat-value">{gallery.length}</span>
                                    <span className="admin-stat-sub">images</span>
                                </div>
                            </div>

                            {/* Charts row */}
                            <div className="admin-dash-grid">
                                {/* Inquiries over 14 days — line chart */}
                                <div className="admin-card admin-card-wide">
                                    <div className="admin-card-head">
                                        <h3>Inquiries — last {last30Days.length} days</h3>
                                        <span className="admin-card-meta">{last30Days.reduce((s, d) => s + d.count, 0)} total</span>
                                    </div>
                                    {(() => {
                                        const W = 700, H = 200;
                                        const padT = 40, padB = 40, padL = 30, padR = 30;
                                        const cW = W - padL - padR;
                                        const cH = H - padT - padB;
                                        const n = last30Days.length;
                                        const maxDay = Math.max(...last30Days.map(d => d.count));
                                        const max = Math.max(maxDay, 1);
                                        const px = i => padL + (n < 2 ? cW / 2 : (i / (n - 1)) * cW);
                                        const py = v => padT + (1 - v / max) * cH;

                                        // Straight lines for data precision
                                        const points = last30Days.map((d, i) => ({ x: px(i), y: py(d.count) }));
                                        const pts = points.map(p => `${p.x},${p.y}`).join(' ');
                                        const areaPath = `M ${px(0)} ${py(0)} L ${pts} L ${px(n - 1)} ${py(0)} Z`;

                                        const handleMouseMove = (e) => {
                                            const svg = e.currentTarget;
                                            const rect = svg.getBoundingClientRect();
                                            const x = ((e.clientX - rect.left) / rect.width) * W;
                                            const closestIndex = Math.round(((x - padL) / cW) * (n - 1));
                                            if (closestIndex >= 0 && closestIndex < n) {
                                                setChartHoverIndex(closestIndex);
                                            }
                                        };

                                        const hoverData = chartHoverIndex !== null ? last30Days[chartHoverIndex] : null;

                                        return (
                                            <div style={{ position: 'relative' }}>
                                                <svg 
                                                    viewBox={`0 0 ${W} ${H}`} 
                                                    className="admin-linechart-interactive"
                                                    onMouseMove={handleMouseMove}
                                                    onMouseLeave={() => setChartHoverIndex(null)}
                                                >
                                                    <defs>
                                                        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#515E3B" stopOpacity="0.1" />
                                                            <stop offset="100%" stopColor="#515E3B" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>

                                                    {/* Grid lines */}
                                                    {[0, 0.5, 1].map(v => (
                                                        <line 
                                                            key={v}
                                                            x1={padL} y1={py(max * v)} x2={W - padR} y2={py(max * v)} 
                                                            stroke="#f0ede8" strokeWidth="1" 
                                                        />
                                                    ))}

                                                    {/* Area fill */}
                                                    <path d={areaPath} fill="url(#lc-fill)" />
                                                    
                                                    {/* Main line */}
                                                    <polyline points={pts} fill="none" stroke="#515E3B" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

                                                    {/* Interaction Layer */}
                                                    {chartHoverIndex !== null && (
                                                        <g>
                                                            <line 
                                                                x1={px(chartHoverIndex)} y1={padT - 10} 
                                                                x2={px(chartHoverIndex)} y2={H - padB} 
                                                                stroke="#515E3B" strokeWidth="1" strokeOpacity="0.3" 
                                                            />
                                                            <circle 
                                                                cx={px(chartHoverIndex)} cy={py(hoverData.count)} 
                                                                r="4" fill="#fff" stroke="#515E3B" strokeWidth="2" 
                                                            />
                                                        </g>
                                                    )}

                                                    {/* X-Axis labels */}
                                                    {last30Days.map((d, i) => (i % Math.max(1, Math.floor(n / 6)) === 0 || i === n - 1) && (
                                                        <text key={d.key} x={px(i)} y={H - 12} textAnchor="middle" fill="#999" fontWeight="500">
                                                            {d.label}
                                                        </text>
                                                    ))}
                                                </svg>

                                                {/* Tooltip */}
                                                {chartHoverIndex !== null && (
                                                    <div className="admin-chart-tooltip" style={{
                                                        left: `${(px(chartHoverIndex) / W) * 100}%`,
                                                        top: `${(py(hoverData.count) / H) * 100}%`,
                                                        transform: `translate(-50%, -120%)`
                                                    }}>
                                                        <div className="admin-tooltip-val">{hoverData.count} inquiries</div>
                                                        <div className="admin-tooltip-date">{hoverData.fullDate}</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Inquiry type breakdown — donut */}
                                <div className="admin-card">
                                    <div className="admin-card-head">
                                        <h3>Inquiry Types</h3>
                                    </div>
                                    <div className="admin-donut-wrap">
                                        <div className="admin-donut" style={donutStyle}>
                                            <div className="admin-donut-hole">
                                                <span>{inqTotal}</span>
                                                <small>total</small>
                                            </div>
                                        </div>
                                        <div className="admin-donut-legend">
                                            <div><i style={{ background: '#a3a3a3' }} />Contact <strong>{typeBreakdown.contact}</strong></div>
                                            <div><i style={{ background: '#8B9A65' }} />Price <strong>{typeBreakdown.price}</strong></div>
                                            <div><i style={{ background: '#515E3B' }} />Quote <strong>{typeBreakdown.quote}</strong></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Most requested products */}
                                <div className="admin-card">
                                    <div className="admin-card-head">
                                        <h3>Most Requested Products</h3>
                                    </div>
                                    {topProducts.length === 0 ? (
                                        <p className="admin-card-empty">No product requests yet.</p>
                                    ) : (
                                        <div className="admin-rank-list">
                                            {topProducts.map(([name, n]) => (
                                                <div className="admin-rank-row" key={name}>
                                                    <span className="admin-rank-name">{name}</span>
                                                    <div className="admin-rank-bar-wrap">
                                                        <div className="admin-rank-bar" style={{ width: `${(n / topProducts[0][1]) * 100}%` }} />
                                                    </div>
                                                    <span className="admin-rank-count">{n}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Top pages */}
                                <div className="admin-card">
                                    <div className="admin-card-head">
                                        <h3>Top Pages</h3>
                                        <button className="admin-card-link" onClick={() => setTabPersist('stats')}>View all</button>
                                    </div>
                                    {topPages.length === 0 ? (
                                        <p className="admin-card-empty">No visits recorded yet.</p>
                                    ) : (
                                        <div className="admin-rank-list">
                                            {topPages.map(p => (
                                                <div className="admin-rank-row" key={p.label}>
                                                    <span className="admin-rank-name admin-mono">{p.label}</span>
                                                    <div className="admin-rank-bar-wrap">
                                                        <div className="admin-rank-bar olive" style={{ width: `${(p.count / topPages[0].count) * 100}%` }} />
                                                    </div>
                                                    <span className="admin-rank-count">{p.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Recent inquiries */}
                                <div className="admin-card">
                                    <div className="admin-card-head">
                                        <h3>Recent Inquiries</h3>
                                        <button className="admin-card-link" onClick={() => setTabPersist('inquiries')}>View all</button>
                                    </div>
                                    {recentInquiries.length === 0 ? (
                                        <p className="admin-card-empty">No inquiries yet.</p>
                                    ) : (
                                        <div className="admin-recent-list">
                                            {recentInquiries.map(inq => (
                                                <div className="admin-recent-row" key={inq.id} onClick={() => { setTabPersist('inquiries'); setExpandedInquiry(inq.id); }}>
                                                    <span className={`admin-inq-type ${inq.type || 'contact'}`}>{inq.type === 'price' ? 'Price' : inq.type === 'quote' ? 'Quote' : 'Contact'}</span>
                                                    <div className="admin-recent-info">
                                                        <strong>{inq.name}</strong>
                                                        <span>{inq.email}</span>
                                                    </div>
                                                    <span className="admin-recent-date">{inqDate(inq)?.toLocaleDateString() || '—'}</span>
                                                    {!inq.read && <span className="admin-unread-dot" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Products tab ──────────────────────────────────────────── */}
                    {!dataLoading && tab === 'products' && (
                        <div className="admin-section">
                            {!editingProduct && !isAdding && (
                                <div className="admin-section-header">
                                    <h2>Products <span className="admin-count">({products.length})</span></h2>
                                    <button className="admin-btn-primary" onClick={startAdd}>
                                        + Add Product
                                    </button>
                                </div>
                            )}

                            {(editingProduct || isAdding) ? (
                                <div className="admin-edit-form">
                                    <div className="admin-form-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <h3>{isAdding ? 'New Product' : 'Edit Product'}</h3>
                                            {!isAdding && <span className="admin-form-slug-badge">{productForm.slug}</span>}
                                        </div>
                                        <button className="admin-btn-close" onClick={() => cancelEdit(true)}>&times;</button>
                                    </div>

                                    <div className="admin-form-body">
                                        {/* Left panel — image + meta */}
                                        <div className="admin-form-aside">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                ref={fileInputRef}
                                                style={{ display: 'none' }}
                                                onChange={handleImageChange}
                                            />
                                            <div
                                                className="admin-form-image-zone"
                                                onClick={() => fileInputRef.current.click()}
                                                title="Click to upload image"
                                            >
                                                {imagePreview
                                                    ? <img src={imagePreview} alt="preview" />
                                                    : (
                                                        <div className="admin-form-image-empty">
                                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                                            <span>Click to upload</span>
                                                        </div>
                                                    )
                                                }
                                                <div className="admin-form-image-overlay">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                                    <span>Change image</span>
                                                </div>
                                            </div>
                                            {imageFile && <p className="admin-filename">{imageFile.name}</p>}

                                            <div className="admin-form-meta">
                                                <div className="admin-fields-row">
                                                    <div className="admin-field">
                                                        <label>Slug <span className="admin-field-hint">{isAdding ? 'used' : ''}</span></label>
                                                        <input
                                                            value={productForm.slug || ''}
                                                            onChange={e => setProductForm(p => ({ ...p, slug: e.target.value }))}
                                                            disabled={!isAdding}
                                                            placeholder="e.g. root"
                                                        />
                                                    </div>
                                                    <div className="admin-field">
                                                        <label>Order</label>
                                                        <input
                                                            type="number"
                                                            value={productForm.order || ''}
                                                            onChange={e => setProductForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                                                        />
                                                    </div>
                                                </div>

                                                <label className="admin-toggle-row">
                                                    <div className="admin-toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!productForm.featured}
                                                            onChange={e => setProductForm(p => ({ ...p, featured: e.target.checked }))}
                                                        />
                                                        <span className="admin-toggle-track" />
                                                    </div>
                                                    <div className="admin-toggle-text">
                                                        <span>Featured on Home</span>
                                                        <small>Show in the 4-product section</small>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Right panel — titles + descriptions */}
                                        <div className="admin-form-fields">
                                            {(() => {
                                                const langs = adminTranslations.languages || [{ code: 'ru', label: 'RU', name: 'Russian' }, { code: 'en', label: 'EN', name: 'English' }];
                                                const activeLang = langs.find(l => l.code === prodLangTab) || langs[0];
                                                const code = activeLang.code;
                                                return (
                                                    <>
                                                        <p className="admin-form-section-label">Translations</p>
                                                        {/* Language picker — one language at a time keeps the form tidy with many languages */}
                                                        <div className="admin-field admin-prod-lang-select">
                                                            <label>Editing language</label>
                                                            <select
                                                                value={code}
                                                                onChange={e => setProdLangTab(e.target.value)}
                                                            >
                                                                {langs.map(lang => (
                                                                    <option key={lang.code} value={lang.code}>
                                                                        {lang.name} ({lang.label})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="admin-field">
                                                            <label>Title <span className="admin-field-lang">{activeLang.name}</span></label>
                                                            <input
                                                                value={productForm[`title_${code}`] || ''}
                                                                onChange={e => setProductForm(p => ({ ...p, [`title_${code}`]: e.target.value }))}
                                                                placeholder={`Title in ${activeLang.name}`}
                                                            />
                                                        </div>
                                                        <div className="admin-field">
                                                            <label>Description <span className="admin-field-lang">{activeLang.name}</span></label>
                                                            <textarea
                                                                rows={4}
                                                                value={productForm[`desc_${code}`] || ''}
                                                                onChange={e => setProductForm(p => ({ ...p, [`desc_${code}`]: e.target.value }))}
                                                                placeholder={`Description in ${activeLang.name}`}
                                                            />
                                                        </div>
                                                    </>
                                                );
                                            })()}

                                            <p className="admin-form-section-label">
                                                Specifications
                                                <span className="admin-field-lang" style={{ marginLeft: 8, fontWeight: 400 }}>
                                                    {(adminTranslations.languages || []).find(l => l.code === prodLangTab)?.name || prodLangTab}
                                                </span>
                                            </p>

                                            {/* Identity */}
                                            <button type="button" className="admin-spec-section-toggle" onClick={() => toggleSpecSection('identity')}>
                                                <span>Identity</span>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: openSpecSections.identity ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                                            </button>
                                            {openSpecSections.identity && (<>
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>Botanical name</label><input value={productForm.specs?.[prodLangTab]?.botanical_name || ''} onChange={e => handleSpecChange('botanical_name', e.target.value)} placeholder="Glycyrrhiza glabra" /></div>
                                                    <div className="admin-field"><label>Origin</label><input value={productForm.specs?.[prodLangTab]?.origin || ''} onChange={e => handleSpecChange('origin', e.target.value)} placeholder="Uzbekistan" /></div>
                                                </div>
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>Part used</label><input value={productForm.specs?.[prodLangTab]?.part_used || ''} onChange={e => handleSpecChange('part_used', e.target.value)} placeholder="Root" /></div>
                                                    <div className="admin-field"><label>Cultivation</label><input value={productForm.specs?.[prodLangTab]?.cultivation || ''} onChange={e => handleSpecChange('cultivation', e.target.value)} placeholder="Wild + artificial" /></div>
                                                </div>
                                            </>)}

                                            {/* Physical */}
                                            <button type="button" className="admin-spec-section-toggle" onClick={() => toggleSpecSection('physical')}>
                                                <span>Physical</span>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: openSpecSections.physical ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                                            </button>
                                            {openSpecSections.physical && (<>
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>Form / cut type</label><input value={productForm.specs?.[prodLangTab]?.form_cut_type || ''} onChange={e => handleSpecChange('form_cut_type', e.target.value)} placeholder="e.g. Fingers, Sticks, Powder" /></div>
                                                    <div className="admin-field"><label>Cut size / length</label><input value={productForm.specs?.[prodLangTab]?.cut_size || ''} onChange={e => handleSpecChange('cut_size', e.target.value)} placeholder="e.g. 5–8 cm" /></div>
                                                </div>
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>Diameter grade</label><input value={productForm.specs?.[prodLangTab]?.diameter_grade || ''} onChange={e => handleSpecChange('diameter_grade', e.target.value)} placeholder="e.g. A / B / C" /></div>
                                                    <div className="admin-field"><label>Processing</label><input value={productForm.specs?.[prodLangTab]?.processing || ''} onChange={e => handleSpecChange('processing', e.target.value)} placeholder="Standard or Peeled" /></div>
                                                </div>
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>Packaging</label><input value={productForm.specs?.[prodLangTab]?.packaging || ''} onChange={e => handleSpecChange('packaging', e.target.value)} placeholder="PP bags 25 kg" /></div>
                                                    <div className="admin-field"><label>MOQ</label><input value={productForm.specs?.[prodLangTab]?.moq || ''} onChange={e => handleSpecChange('moq', e.target.value)} placeholder="e.g. 1 MT" /></div>
                                                </div>
                                            </>)}

                                            {/* Quality */}
                                            <button type="button" className="admin-spec-section-toggle" onClick={() => toggleSpecSection('quality')}>
                                                <span>Quality</span>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: openSpecSections.quality ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                                            </button>
                                            {openSpecSections.quality && (<>
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>Moisture</label><input value={productForm.specs?.[prodLangTab]?.moisture || ''} onChange={e => handleSpecChange('moisture', e.target.value)} placeholder="≤ 8%" /></div>
                                                    <div className="admin-field"><label>Ash</label><input value={productForm.specs?.[prodLangTab]?.ash || ''} onChange={e => handleSpecChange('ash', e.target.value)} placeholder="≤ 9%" /></div>
                                                </div>
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>Glycyrrhizin</label><input value={productForm.specs?.[prodLangTab]?.glycyrrhizin || ''} onChange={e => handleSpecChange('glycyrrhizin', e.target.value)} placeholder="≥ 4% (root) / 8–12% (extract)" /></div>
                                                    <div className="admin-field"><label>Foreign matter</label><input value={productForm.specs?.[prodLangTab]?.foreign_matter || ''} onChange={e => handleSpecChange('foreign_matter', e.target.value)} placeholder="≤ 1%" /></div>
                                                </div>
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>Heavy metals</label><input value={productForm.specs?.[prodLangTab]?.heavy_metals || ''} onChange={e => handleSpecChange('heavy_metals', e.target.value)} placeholder="Within WHO/EU limits" /></div>
                                                    <div className="admin-field"><label>Pesticide residues</label><input value={productForm.specs?.[prodLangTab]?.pesticide_residues || ''} onChange={e => handleSpecChange('pesticide_residues', e.target.value)} placeholder="Within WHO/EU limits" /></div>
                                                </div>
                                            </>)}

                                            {/* Microbiology */}
                                            <button type="button" className="admin-spec-section-toggle" onClick={() => toggleSpecSection('microbiology')}>
                                                <span>Microbiology</span>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: openSpecSections.microbiology ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                                            </button>
                                            {openSpecSections.microbiology && (<>
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>TPC</label><input value={productForm.specs?.[prodLangTab]?.tpc || ''} onChange={e => handleSpecChange('tpc', e.target.value)} placeholder="≤ 100,000 CFU/g" /></div>
                                                    <div className="admin-field"><label>Yeast & Mould</label><input value={productForm.specs?.[prodLangTab]?.yeast_mould || ''} onChange={e => handleSpecChange('yeast_mould', e.target.value)} placeholder="≤ 1,000 CFU/g" /></div>
                                                </div>
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>E. coli</label><input value={productForm.specs?.[prodLangTab]?.e_coli || ''} onChange={e => handleSpecChange('e_coli', e.target.value)} placeholder="Absent" /></div>
                                                    <div className="admin-field"><label>Salmonella</label><input value={productForm.specs?.[prodLangTab]?.salmonella || ''} onChange={e => handleSpecChange('salmonella', e.target.value)} placeholder="Absent" /></div>
                                                </div>
                                            </>)}

                                            {/* Storage & Shelf Life */}
                                            <button type="button" className="admin-spec-section-toggle" onClick={() => toggleSpecSection('storage')}>
                                                <span>Storage & Shelf Life</span>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: openSpecSections.storage ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                                            </button>
                                            {openSpecSections.storage && (
                                                <div className="admin-fields-row">
                                                    <div className="admin-field"><label>Shelf life</label><input value={productForm.specs?.[prodLangTab]?.shelf_life || ''} onChange={e => handleSpecChange('shelf_life', e.target.value)} placeholder="24 months" /></div>
                                                    <div className="admin-field"><label>Storage conditions</label><input value={productForm.specs?.[prodLangTab]?.storage || ''} onChange={e => handleSpecChange('storage', e.target.value)} placeholder="≤ 25°C, cool dry, no sunlight" /></div>
                                                </div>
                                            )}

                                            {/* Accompanying Documents */}
                                            <button type="button" className="admin-spec-section-toggle" onClick={() => toggleSpecSection('documents')}>
                                                <span>Accompanying Documents</span>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: openSpecSections.documents ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                                            </button>
                                            {openSpecSections.documents && (() => {
                                                const currentDocs = productForm.specs?.[prodLangTab]?.documents || [];
                                                const fallbackLang = (adminTranslations.languages || []).find(l => l.code !== prodLangTab && (productForm.specs?.[l.code]?.documents || []).length > 0);
                                                const fallbackDocs = fallbackLang ? (productForm.specs[fallbackLang.code].documents) : [];
                                                return (
                                                <div className="admin-doc-builder">
                                                    {currentDocs.length === 0 && fallbackDocs.length > 0 && (
                                                        <div className="admin-doc-copy-hint">
                                                            <span>No documents for this language.</span>
                                                            <button
                                                                type="button"
                                                                className="admin-btn-secondary admin-btn-sm"
                                                                onClick={() => handleSpecChange('documents', [...fallbackDocs])}
                                                            >
                                                                Copy from {fallbackLang.label} to translate
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="admin-doc-input-row">
                                                        <input
                                                            type="text"
                                                            value={newDocInput}
                                                            onChange={e => setNewDocInput(e.target.value)}
                                                            placeholder="e.g. Phytosanitary Certificate"
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const val = newDocInput.trim();
                                                                    if (!val) return;
                                                                    handleSpecChange('documents', [...currentDocs, val]);
                                                                    setNewDocInput('');
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="admin-btn-secondary admin-doc-add-btn"
                                                            onClick={() => {
                                                                const val = newDocInput.trim();
                                                                if (!val) return;
                                                                handleSpecChange('documents', [...currentDocs, val]);
                                                                setNewDocInput('');
                                                            }}
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                    {currentDocs.length > 0 && (
                                                        <ul className="admin-doc-items">
                                                            {currentDocs.map((doc, i) => (
                                                                <li key={i} className="admin-doc-tag">
                                                                    <input
                                                                        type="text"
                                                                        value={doc}
                                                                        onChange={e => {
                                                                            const updated = [...currentDocs];
                                                                            updated[i] = e.target.value;
                                                                            handleSpecChange('documents', updated);
                                                                        }}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSpecChange('documents', currentDocs.filter((_, idx) => idx !== i))}
                                                                        aria-label="Remove"
                                                                    >×</button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div className="admin-edit-actions">
                                        <button
                                            className="admin-btn-primary"
                                            onClick={saveProductEdit}
                                            disabled={productSaving}
                                        >
                                            {productSaving ? 'Saving…' : (isAdding ? 'Add Product' : 'Save Changes')}
                                        </button>
                                        <button className="admin-btn-secondary" onClick={() => cancelEdit(true)}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="admin-list-controls">
                                        <div className="admin-search">
                                            <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                            <input
                                                type="text"
                                                placeholder="Search products by name or slug..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="admin-filter-chips">
                                            <button
                                                className={`admin-chip ${!filterFeatured ? 'active' : ''}`}
                                                onClick={() => setFilterFeatured(false)}
                                            >
                                                All ({products.length})
                                            </button>
                                            <button
                                                className={`admin-chip ${filterFeatured ? 'active' : ''}`}
                                                onClick={() => setFilterFeatured(true)}
                                            >
                                                Featured ({products.filter(p => p.featured).length})
                                            </button>
                                        </div>
                                    </div>

                                    <div className="admin-products-list">
                                        {pagedProducts.length > 0 ? (
                                            pagedProducts.map((product, index) => {
                                                const globalIndex = productsPage * PRODUCTS_PER_PAGE + index;
                                                return (
                                                <div key={product.slug} className="admin-product-row">
                                                    {canReorder && (
                                                        <div className="admin-reorder">
                                                            <button
                                                                className="admin-reorder-btn"
                                                                onClick={() => moveProduct(product, 'up')}
                                                                disabled={globalIndex === 0}
                                                                title="Move up"
                                                                aria-label="Move up"
                                                            >
                                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                                                            </button>
                                                            <button
                                                                className="admin-reorder-btn"
                                                                onClick={() => moveProduct(product, 'down')}
                                                                disabled={globalIndex === filteredProducts.length - 1}
                                                                title="Move down"
                                                                aria-label="Move down"
                                                            >
                                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="admin-product-order-wrap">
                                                        <span className="admin-product-order" title="Display order">{product.order ?? '—'}</span>
                                                        <button
                                                            className={`admin-star-toggle-sm ${product.featured ? 'active' : ''}`}
                                                            onClick={() => toggleFeatured(product)}
                                                            title={product.featured ? 'Featured on Home — click to remove' : 'Click to feature on Home'}
                                                            aria-pressed={!!product.featured}
                                                        >
                                                            <svg viewBox="0 0 24 24" width="14" height="14" fill={product.featured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <img src={product.image} alt={product.title_en} />
                                                    <div className="admin-product-row-info">
                                                        <div className="admin-product-row-main">
                                                            <strong>{product.title_en}</strong>
                                                        </div>
                                                        <span className="admin-product-slug">{product.slug}</span>
                                                        <span className="admin-product-ru">{product.title_ru}</span>
                                                    </div>
                                                    <div className="admin-product-row-actions">
                                                        <button
                                                            className="admin-btn-secondary admin-btn-sm"
                                                            onClick={() => startEdit(product)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="admin-btn-danger admin-btn-sm"
                                                            onClick={() => handleDeleteProduct(product)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                );
                                            })
                                        ) : (
                                            <div className="admin-empty-state">
                                                No products found.
                                            </div>
                                        )}
                                    </div>
                                    <div className="admin-pagination">
                                        <button className="admin-page-btn" onClick={() => setProductsPage(p => p - 1)} disabled={productsPage === 0}>‹ Prev</button>
                                        <span className="admin-page-info">Page {productsPage + 1} of {Math.max(productsTotalPages, 1)}</span>
                                        <button className="admin-page-btn" onClick={() => setProductsPage(p => p + 1)} disabled={productsPage >= productsTotalPages - 1 || productsTotalPages <= 1}>Next ›</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Inquiries tab ─────────────────────────────────────────── */}
                    {!dataLoading && tab === 'inquiries' && (
                        <div className="admin-section">

                            {/* ── Detail view ── */}
                            {selectedInquiry ? (
                                <>
                                    <div className="admin-section-header">
                                        <div className="admin-inq-detail-heading">
                                            <button className="admin-back-btn" onClick={closeInquiry}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                                Back to Inquiries
                                            </button>
                                            <span className={`admin-inq-type ${selectedInquiry.type || 'contact'}`}>
                                                {selectedInquiry.type === 'price' ? 'Price Request' : selectedInquiry.type === 'quote' ? 'Quote Request' : 'Contact'}
                                            </span>
                                        </div>
                                        <div className="admin-inq-detail-actions">
                                            <a href={`mailto:${selectedInquiry.email}`} className="admin-btn-primary admin-btn-sm" style={{ textDecoration: 'none' }}>Reply by Email</a>
                                            <button className="admin-btn-danger admin-btn-sm" onClick={() => handleDeleteInquiry(selectedInquiry)}>Delete</button>
                                        </div>
                                    </div>

                                    <div className="admin-inq-detail-body">
                                        {/* Left — contact info */}
                                        <div className="admin-inq-detail-aside">
                                            <div className="admin-inq-avatar">
                                                {(selectedInquiry.name || '?')[0].toUpperCase()}
                                            </div>
                                            <h3 className="admin-inq-detail-name">{selectedInquiry.name || '—'}</h3>
                                            {selectedInquiry.company && <p className="admin-inq-detail-company">{selectedInquiry.company}</p>}

                                            <div className="admin-inq-meta-list">
                                                <div className="admin-inq-meta-row">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                                    <a href={`mailto:${selectedInquiry.email}`}>{selectedInquiry.email || '—'}</a>
                                                </div>
                                                {selectedInquiry.phone && (
                                                    <div className="admin-inq-meta-row">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.1 19.79 19.79 0 0 1 1.61 2.49 2 2 0 0 1 3.6.5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 15.5z"/></svg>
                                                        <a href={`tel:${selectedInquiry.phone}`}>{selectedInquiry.phone}</a>
                                                    </div>
                                                )}
                                                <div className="admin-inq-meta-row">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                    <span>{inqDate(selectedInquiry)?.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) || '—'}</span>
                                                </div>
                                            </div>

                                            <div className={`admin-inq-read-status ${selectedInquiry.read ? 'read' : 'unread'}`}>
                                                {selectedInquiry.read ? 'Read' : 'Unread'}
                                            </div>
                                        </div>

                                        {/* Right — inquiry content */}
                                        <div className="admin-inq-detail-main">
                                            {/* Product / quantity */}
                                            {(selectedInquiry.product || selectedInquiry.quantity) && (
                                                <div className="admin-inq-detail-card">
                                                    <p className="admin-inq-detail-card-label">Product Request</p>
                                                    {selectedInquiry.product && (
                                                        <p className="admin-inq-detail-card-value">{selectedInquiry.product}</p>
                                                    )}
                                                    {selectedInquiry.quantity && (
                                                        <p className="admin-inq-detail-quantity">Quantity: <strong>{selectedInquiry.quantity}</strong></p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Quote items */}
                                            {Array.isArray(selectedInquiry.items) && selectedInquiry.items.length > 0 && (
                                                <div className="admin-inq-detail-card">
                                                    <p className="admin-inq-detail-card-label">Requested Products ({selectedInquiry.items.length})</p>
                                                    <div className="admin-inq-items-list">
                                                        {selectedInquiry.items.map((it, idx) => (
                                                            <div className="admin-inq-item-row" key={idx}>
                                                                {it.image && <img src={it.image} alt={it.title} className="admin-inq-item-img" />}
                                                                <div className="admin-inq-item-info">
                                                                    <span className="admin-inq-item-title">{it.title}</span>
                                                                    {it.quantity && <span className="admin-inq-item-qty">{it.quantity}</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Subject */}
                                            {selectedInquiry.subject && (
                                                <div className="admin-inq-detail-card">
                                                    <p className="admin-inq-detail-card-label">Subject</p>
                                                    <p className="admin-inq-detail-card-value">{selectedInquiry.subject}</p>
                                                </div>
                                            )}

                                            {/* Message */}
                                            {selectedInquiry.message && (
                                                <div className="admin-inq-detail-card">
                                                    <p className="admin-inq-detail-card-label">Message</p>
                                                    <p className="admin-inq-detail-message">{selectedInquiry.message}</p>
                                                </div>
                                            )}

                                            {/* Empty state */}
                                            {!selectedInquiry.product && !selectedInquiry.quantity && !selectedInquiry.subject && !selectedInquiry.message && !(Array.isArray(selectedInquiry.items) && selectedInquiry.items.length > 0) && (
                                                <div className="admin-inq-detail-card">
                                                    <p className="admin-inq-detail-card-label">No additional content</p>
                                                    <p className="admin-inq-detail-message" style={{ color: '#aaa' }}>This inquiry had no message or product details.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* ── List view ── */
                                <>
                                    <div className="admin-section-header">
                                        <h2>Inquiries <span className="admin-count">({inquiries.length} total{unreadCount > 0 ? `, ${unreadCount} unread` : ''})</span></h2>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="admin-btn-secondary" onClick={loadData}>↺ Refresh</button>
                                            {unreadCount > 0 && (
                                                <button className="admin-btn-secondary" onClick={markAllRead}>Mark all read</button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="admin-list-controls">
                                        <div className="admin-search">
                                            <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                            <input
                                                type="text"
                                                placeholder="Search by name, email, product..."
                                                value={inqSearch}
                                                onChange={e => setInqSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="admin-filter-chips">
                                            {[
                                                ['all', `All (${inquiries.length})`],
                                                ['unread', `Unread (${unreadCount})`],
                                                ['contact', `Contact (${typeBreakdown.contact})`],
                                                ['price', `Price (${typeBreakdown.price})`],
                                                ['quote', `Quote (${typeBreakdown.quote})`],
                                            ].map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    className={`admin-chip ${inqFilter === key ? 'active' : ''}`}
                                                    onClick={() => setInqFilter(key)}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="admin-table-wrap">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: colWidths.type }} className="admin-resizable-th" title="Drag to resize">
                                                        <span>Type</span>
                                                        <div className="admin-resizer" onMouseDown={(e) => startResize(e, 'type')} />
                                                    </th>
                                                    <th style={{ width: colWidths.name }} className="admin-resizable-th" title="Drag to resize">
                                                        <span>Name</span>
                                                        <div className="admin-resizer" onMouseDown={(e) => startResize(e, 'name')} />
                                                    </th>
                                                    <th style={{ width: colWidths.email }} className="admin-resizable-th" title="Drag to resize">
                                                        <span>Email</span>
                                                        <div className="admin-resizer" onMouseDown={(e) => startResize(e, 'email')} />
                                                    </th>
                                                    <th style={{ width: colWidths.details }} className="admin-resizable-th" title="Drag to resize">
                                                        <span>Details</span>
                                                        <div className="admin-resizer" onMouseDown={(e) => startResize(e, 'details')} />
                                                    </th>
                                                    <th style={{ width: colWidths.date }} className="admin-resizable-th" title="Drag to resize">
                                                        <span>Date</span>
                                                        <div className="admin-resizer" onMouseDown={(e) => startResize(e, 'date')} />
                                                    </th>
                                                    <th style={{ width: '90px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredInquiries.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="admin-table-empty">
                                                            {inquiries.length === 0
                                                                ? 'No inquiries yet. They will appear here when visitors submit a contact, price, or quote request.'
                                                                : 'No inquiries match this filter.'}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    pagedInquiries.map(inq => (
                                                        <Fragment key={inq.id}>
                                                            <tr
                                                                className={`admin-trow admin-trow-clickable ${!inq.read ? 'unread' : ''} ${expandedInquiry === inq.id ? 'expanded' : ''}`}
                                                                onClick={() => setExpandedInquiry(expandedInquiry === inq.id ? null : inq.id)}
                                                            >
                                                                <td>
                                                                    <span className={`admin-inq-type ${inq.type || 'contact'}`}>
                                                                        {inq.type === 'price' ? 'Price' : inq.type === 'quote' ? 'Quote' : 'Contact'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="admin-tcell-name">
                                                                        {!inq.read && <span className="admin-unread-dot" />}
                                                                        {inq.name || '—'}
                                                                    </span>
                                                                </td>
                                                                <td className="admin-tcell-muted">{inq.email || '—'}</td>
                                                                <td className="admin-tcell-muted">
                                                                    {inq.product
                                                                        ? inq.product
                                                                        : Array.isArray(inq.items) && inq.items.length > 0
                                                                            ? `${inq.items.length} product(s)`
                                                                            : '—'}
                                                                </td>
                                                                <td className="admin-tcell-muted">
                                                                    {inqDate(inq)?.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) || '—'}
                                                                </td>
                                                                <td onClick={e => e.stopPropagation()}>
                                                                    <button className="admin-btn-secondary admin-btn-sm" onClick={() => openInquiry(inq)}>View</button>
                                                                </td>
                                                            </tr>
                                                            {expandedInquiry === inq.id && (
                                                                <tr className="admin-trow-detail">
                                                                    <td colSpan={6}>
                                                                        <div className="admin-inquiry-detail">
                                                                            {inq.phone && <p><strong>Phone:</strong> {inq.phone}</p>}
                                                                            {inq.company && <p><strong>Company:</strong> {inq.company}</p>}
                                                                            {inq.quantity && <p><strong>Quantity:</strong> {inq.quantity}</p>}
                                                                            {inq.subject && <p><strong>Subject:</strong> {inq.subject}</p>}
                                                                            {Array.isArray(inq.items) && inq.items.length > 0 && (
                                                                                <div className="admin-inquiry-msg">
                                                                                    <strong>Requested products:</strong>
                                                                                    <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                                                                                        {inq.items.map((it, idx) => (
                                                                                            <li key={idx}>{it.title}{it.quantity ? ` — ${it.quantity}` : ''}</li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}
                                                                            {inq.message && (
                                                                                <div className="admin-inquiry-msg">
                                                                                    <strong>Message:</strong><br/>
                                                                                    {inq.message}
                                                                                </div>
                                                                            )}
                                                                            <div className="admin-inquiry-actions">
                                                                                <a href={`mailto:${inq.email}`} className="admin-btn-primary admin-btn-sm" style={{ textDecoration: 'none' }}>Reply by Email</a>
                                                                                {!inq.read && (
                                                                                    <button className="admin-btn-secondary admin-btn-sm" onClick={() => handleMarkRead(inq.id)}>Mark as Read</button>
                                                                                )}
                                                                                <button className="admin-btn-danger admin-btn-sm" onClick={() => handleDeleteInquiry(inq)}>Delete</button>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </Fragment>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="admin-pagination">
                                        <button className="admin-page-btn" onClick={() => setInqPage(p => p - 1)} disabled={inqPage === 0}>‹ Prev</button>
                                        <span className="admin-page-info">Page {inqPage + 1} of {Math.max(inqTotalPages, 1)}</span>
                                        <button className="admin-page-btn" onClick={() => setInqPage(p => p + 1)} disabled={inqPage >= inqTotalPages - 1 || inqTotalPages <= 1}>Next ›</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Stats tab ─────────────────────────────────────────────── */}
                    {!dataLoading && tab === 'stats' && (
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <h2>Visitor Stats</h2>
                                <button
                                    className="admin-btn-secondary"
                                    disabled={statsLoading}
                                    onClick={async () => {
                                        setStatsLoading(true);
                                        try {
                                            const sts = await fetchStats();
                                            setStats(sts || { total: 0, paths: {} });
                                        } finally {
                                            setStatsLoading(false);
                                        }
                                    }}
                                >
                                    {statsLoading ? 'Refreshing…' : '↺ Refresh'}
                                </button>
                            </div>

                            {/* KPI row */}
                            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                <div className="admin-stat-card">
                                    <span className="admin-stat-label">Total Page Views</span>
                                    <span className="admin-stat-value">{totalViews.toLocaleString()}</span>
                                </div>
                                <div className="admin-stat-card">
                                    <span className="admin-stat-label">Pages Tracked</span>
                                    <span className="admin-stat-value">{pageStats.all.length}</span>
                                </div>
                                <div className="admin-stat-card">
                                    <span className="admin-stat-label">Product Page Views</span>
                                    <span className="admin-stat-value">{pageStats.productViews.reduce((s, p) => s + p.count, 0).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Product page views — full-width table */}
                            <div className="admin-card admin-card-full">
                                <div className="admin-card-head">
                                    <h3>Product Page Views</h3>
                                    <span className="admin-card-meta">which products draw interest</span>
                                </div>
                                {pageStats.productViews.length === 0 ? (
                                    <div className="admin-pv-empty">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                        <p>No product pages viewed yet.</p>
                                        <span>Views are tracked automatically when visitors open a product page.</span>
                                    </div>
                                ) : (
                                    <table className="admin-pv-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Product</th>
                                                <th>Views</th>
                                                <th>vs. top</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const paged = pageStats.productViews.slice(statsPvPage * 20, (statsPvPage + 1) * 20);
                                                if (paged.length === 0) return null;
                                                const maxPv = pageStats.productViews[0].count;
                                                return paged.map((p, i) => {
                                                    const globalRank = statsPvPage * 20 + i + 1;
                                                    const barPct = (p.count / maxPv) * 100;
                                                    return (
                                                        <tr key={p.slug}>
                                                            <td className="admin-pv-rank">#{globalRank}</td>
                                                            <td className="admin-pv-title">
                                                                <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer" className="admin-pv-link">{p.title}</a>
                                                                <small className="admin-pv-slug-inline">{p.slug}</small>
                                                            </td>
                                                            <td className="admin-pv-views">{p.count.toLocaleString()}</td>
                                                            <td className="admin-pv-share-cell">
                                                                <div className="admin-pv-bar-wrap">
                                                                    <div className="admin-pv-bar" style={{ width: `${barPct}%` }} />
                                                                </div>
                                                                <span>{Math.round(barPct)}%</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                )}
                                {Math.ceil(pageStats.productViews.length / 20) > 1 && (
                                    <div className="admin-pagination">
                                        <button className="admin-page-btn" onClick={() => setStatsPvPage(p => p - 1)} disabled={statsPvPage === 0}>‹ Prev</button>
                                        <span className="admin-page-info">Page {statsPvPage + 1} of {Math.ceil(pageStats.productViews.length / 20)}</span>
                                        <button className="admin-page-btn" onClick={() => setStatsPvPage(p => p + 1)} disabled={statsPvPage >= Math.ceil(pageStats.productViews.length / 20) - 1}>Next ›</button>
                                    </div>
                                )}
                            </div>

                            {/* All pages breakdown */}
                            <div className="admin-card admin-card-full">
                                <div className="admin-card-head">
                                    <h3>All Pages</h3>
                                    <span className="admin-card-meta">{totalViews.toLocaleString()} total views</span>
                                </div>
                                {pageStats.all.length === 0 ? (
                                    <p className="admin-card-empty">No visits recorded yet.</p>
                                ) : (
                                    <table className="admin-pv-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Page</th>
                                                <th>Views</th>
                                                <th>% of total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pageStats.all.slice(statsAllPage * 20, (statsAllPage + 1) * 20).map((p, i) => {
                                                const globalRank = statsAllPage * 20 + i + 1;
                                                const pct = totalViews ? (p.count / totalViews) * 100 : 0;
                                                const pctRounded = Math.round(pct);
                                                return (
                                                    <tr key={p.path}>
                                                        <td className="admin-pv-rank">#{globalRank}</td>
                                                        <td className="admin-pv-title admin-mono">{p.label}</td>
                                                        <td className="admin-pv-views">{p.count.toLocaleString()}</td>
                                                        <td className="admin-pv-share-cell">
                                                            <div className="admin-pv-bar-wrap">
                                                                <div className="admin-pv-bar olive" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span>{pctRounded}%</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                                {Math.ceil(pageStats.all.length / 20) > 1 && (
                                    <div className="admin-pagination">
                                        <button className="admin-page-btn" onClick={() => setStatsAllPage(p => p - 1)} disabled={statsAllPage === 0}>‹ Prev</button>
                                        <span className="admin-page-info">Page {statsAllPage + 1} of {Math.ceil(pageStats.all.length / 20)}</span>
                                        <button className="admin-page-btn" onClick={() => setStatsAllPage(p => p + 1)} disabled={statsAllPage >= Math.ceil(pageStats.all.length / 20) - 1}>Next ›</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Gallery tab ───────────────────────────────────────────── */}
                    {!dataLoading && tab === 'gallery' && (
                        <div className="admin-section">
                            {/* Lightbox */}
                            {galleryLightbox !== null && (
                                <div className="admin-lightbox" onClick={() => setGalleryLightbox(null)}>
                                    <button className="admin-lightbox-close" onClick={() => setGalleryLightbox(null)}>&times;</button>
                                    <img src={gallery[galleryLightbox]} alt="" onClick={e => e.stopPropagation()} />
                                    <div className="admin-lightbox-nav">
                                        <button
                                            disabled={galleryLightbox === 0}
                                            onClick={e => { e.stopPropagation(); setGalleryLightbox(i => i - 1); }}
                                        >&#8592;</button>
                                        <span>{galleryLightbox + 1} / {gallery.length}</span>
                                        <button
                                            disabled={galleryLightbox === gallery.length - 1}
                                            onClick={e => { e.stopPropagation(); setGalleryLightbox(i => i + 1); }}
                                        >&#8594;</button>
                                    </div>
                                </div>
                            )}

                            <div className="admin-section-header">
                                <h2>Gallery <span className="admin-count">({gallery.length} images)</span></h2>
                                <button
                                    className="admin-btn-primary"
                                    onClick={() => galleryInputRef.current.click()}
                                    disabled={galleryUploading}
                                >
                                    {galleryUploading
                                        ? `Uploading ${galleryUploadProgress.done}/${galleryUploadProgress.total}…`
                                        : '+ Upload Images'}
                                </button>
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                ref={galleryInputRef}
                                style={{ display: 'none' }}
                                onChange={e => handleGalleryUpload(e.target.files)}
                            />

                            {/* Drop zone */}
                            <div
                                className={`admin-gallery-dropzone ${galleryDragging ? 'dragging' : ''} ${galleryUploading ? 'uploading' : ''}`}
                                onDragOver={e => { e.preventDefault(); setGalleryDragging(true); }}
                                onDragLeave={() => setGalleryDragging(false)}
                                onDrop={e => {
                                    e.preventDefault();
                                    setGalleryDragging(false);
                                    handleGalleryUpload(e.dataTransfer.files);
                                }}
                                onClick={() => !galleryUploading && galleryInputRef.current.click()}
                            >
                                {galleryUploading ? (
                                    <>
                                        <div className="admin-gallery-drop-spinner" />
                                        <p>Uploading {galleryUploadProgress.done} of {galleryUploadProgress.total}…</p>
                                    </>
                                ) : (
                                    <>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                        <p>Drag & drop images here, or <span>click to browse</span></p>
                                        <small>Multiple files supported · JPG, PNG, WebP</small>
                                    </>
                                )}
                            </div>

                            {/* Grid */}
                            {gallery.length === 0 ? (
                                <div className="admin-gallery-empty">
                                    <p>No images yet. Upload your first image above.</p>
                                </div>
                            ) : (
                                <div className="admin-gallery-grid">
                                    {gallery.map((src, i) => (
                                        <div key={src + i} className="admin-gallery-item">
                                            <img
                                                src={src}
                                                alt={`Gallery ${i + 1}`}
                                                onClick={() => setGalleryLightbox(i)}
                                            />
                                            <div className="admin-gallery-overlay">
                                                <button
                                                    className="admin-gallery-view"
                                                    onClick={() => setGalleryLightbox(i)}
                                                    title="Preview"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                </button>
                                                <button
                                                    className="admin-gallery-remove"
                                                    onClick={() => removeGalleryImage(i)}
                                                    title="Remove"
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                                </button>
                                            </div>
                                            <span className="admin-gallery-num">{i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Settings tab (includes Database) ──────────────────────── */}
                    {!dataLoading && tab === 'settings' && (
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <h2>Settings</h2>
                                <button className="admin-btn-primary" onClick={saveSettingsData} disabled={settingsSaving}>
                                    {settingsSaving ? 'Saving…' : 'Save Settings'}
                                </button>
                            </div>

                            {/* Contact info */}
                            <div className="admin-settings-card">
                                <div className="admin-settings-card-head">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                    <h3>Contact Information</h3>
                                </div>
                                <div className="admin-fields-row">
                                    <div className="admin-field">
                                        <label>Email</label>
                                        <input value={settings.email || ''} onChange={e => handleSettingsChange('email', e.target.value)} placeholder="info@example.com" />
                                    </div>
                                    <div className="admin-field">
                                        <label>Website</label>
                                        <input value={settings.website || ''} onChange={e => handleSettingsChange('website', e.target.value)} placeholder="https://example.com" />
                                    </div>
                                </div>
                                <div className="admin-fields-row">
                                    <div className="admin-field">
                                        <label>Phone 1</label>
                                        <input value={(settings.phone || [])[0] || ''} onChange={e => handlePhoneChange(0, e.target.value)} placeholder="+998 XX XXX XX XX" />
                                    </div>
                                    <div className="admin-field">
                                        <label>Phone 2</label>
                                        <input value={(settings.phone || [])[1] || ''} onChange={e => handlePhoneChange(1, e.target.value)} placeholder="+998 XX XXX XX XX" />
                                    </div>
                                </div>
                                <div className="admin-fields-row">
                                    {(adminTranslations.languages || [{ code: 'ru', label: 'RU', name: 'Russian' }, { code: 'en', label: 'EN', name: 'English' }]).map(lang => (
                                        <div key={lang.code} className="admin-field">
                                            <label>Address <span className="admin-field-lang">{lang.label}</span></label>
                                            <textarea rows={2} value={settings[`address_${lang.code}`] || ''} onChange={e => handleSettingsChange(`address_${lang.code}`, e.target.value)} placeholder={`Address in ${lang.name}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Social */}
                            <div className="admin-settings-card">
                                <div className="admin-settings-card-head">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2H3v16h5v4l4-4h5l4-4V2z"/></svg>
                                    <h3>Social & Messaging</h3>
                                </div>
                                <div className="admin-fields-row">
                                    <div className="admin-field">
                                        <label>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.998 0C5.375 0 .003 5.373.003 11.998c0 2.117.553 4.099 1.521 5.823L0 24l6.32-1.659A11.944 11.944 0 0011.998 24C18.623 24 24 18.626 24 11.998 24 5.374 18.623 0 11.998 0zm0 21.818a9.807 9.807 0 01-5.002-1.37l-.358-.214-3.75.984 1.002-3.656-.235-.375a9.826 9.826 0 01-1.507-5.187c0-5.42 4.41-9.829 9.829-9.829 2.628 0 5.097 1.025 6.952 2.884a9.787 9.787 0 012.878 6.953c-.003 5.42-4.413 9.81-9.809 9.81z"/></svg>
                                            WhatsApp <span className="admin-field-hint">digits only, no +</span>
                                        </label>
                                        <input value={settings.whatsapp || ''} onChange={e => handleSettingsChange('whatsapp', e.target.value)} placeholder="998991234567" />
                                    </div>
                                    <div className="admin-field">
                                        <label>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#229ED9" stroke="none"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.375 14.26l-2.95-.924c-.641-.204-.654-.641.136-.948l11.53-4.448c.537-.194 1.006.131.471 2.308z"/></svg>
                                            Telegram <span className="admin-field-hint">no @</span>
                                        </label>
                                        <input value={settings.telegram || ''} onChange={e => handleSettingsChange('telegram', e.target.value)} placeholder="username" />
                                    </div>
                                </div>
                            </div>

                            {/* Database */}
                            <div className="admin-settings-card admin-settings-card-danger">
                                <div className="admin-settings-card-head">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                                    <h3>Database</h3>
                                </div>
                                <p className="admin-settings-desc">Populate Firestore for the first time, or reset all content to built-in defaults. Seeding overwrites existing data.</p>
                                <div className="admin-settings-seed-row">
                                    <button className="admin-btn-secondary" onClick={handleSeed} disabled={seeding}>
                                        {seeding ? 'Seeding…' : 'Seed (skip if data exists)'}
                                    </button>
                                    <button className="admin-btn-danger" onClick={forceSeed} disabled={seeding}>
                                        Force re-seed (overwrites all)
                                    </button>
                                </div>
                                {seedMsg && <p className="admin-seed-msg">{seedMsg}</p>}
                            </div>
                        </div>
                    )}

                    {/* ── Languages tab ─────────────────────────────────────────── */}
                    {!dataLoading && tab === 'languages' && (
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <div>
                                    <h2>Languages & Translations</h2>
                                    <p className="admin-section-sublabel">
                                        Edit interface text below, then save to publish changes to the live site.
                                    </p>
                                </div>
                                <div className="admin-save-group">
                                    {translationsDirty && (
                                        <span className="admin-unsaved-pill">● Unsaved changes</span>
                                    )}
                                    <button
                                        className="admin-btn-primary"
                                        onClick={saveTranslationsData}
                                        disabled={translationsSaving || !translationsDirty}
                                    >
                                        {translationsSaving
                                            ? 'Saving…'
                                            : translationsDirty
                                                ? 'Save changes'
                                                : 'Saved'}
                                    </button>
                                </div>
                            </div>

                            {/* ── Language management ── */}
                            <div className="admin-settings-card">
                                <div className="admin-settings-card-head">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                    <h3>Active Languages</h3>
                                </div>
                                <div className="admin-lang-list">
                                    {(adminTranslations.languages || []).map(lang => (
                                        <div key={lang.code} className="admin-lang-row">
                                            <span className="admin-lang-badge">{lang.label}</span>
                                            <span className="admin-lang-name">{lang.name}</span>
                                            <span className="admin-lang-code">{lang.code}</span>
                                            <button
                                                className="admin-btn-danger admin-btn-sm"
                                                onClick={() => removeLanguage(lang.code)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <button className="admin-btn-secondary" onClick={() => { setNewLangForm({ code: '', label: '', name: '' }); setShowAddLangModal(true); }}>
                                        + Add Language
                                    </button>
                                </div>
                            </div>

                            {/* ── Translation editor ── */}
                            <div className="admin-settings-card">
                                <div className="admin-settings-card-head">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                    <h3>Edit Translations</h3>
                                </div>

                                {/* Language picker — dropdown scales cleanly with many languages */}
                                <div className="admin-field admin-prod-lang-select">
                                    <label>Editing language</label>
                                    <select
                                        value={transLangTab}
                                        onChange={e => setTransLangTab(e.target.value)}
                                    >
                                        {(adminTranslations.languages || []).map(lang => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.name} ({lang.label})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Translation groups */}
                                {transLangTab && (
                                    <div className="admin-trans-editor">
                                        {TRANSLATION_GROUPS.map(group => (
                                            <div key={group.id} className="admin-trans-group">
                                                <button
                                                    className="admin-trans-group-header"
                                                    onClick={() => toggleGroup(group.id)}
                                                >
                                                    <span>{group.label}</span>
                                                    <span className="admin-trans-group-count">{group.keys.length} strings</span>
                                                    <svg
                                                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                        stroke="currentColor" strokeWidth="2.5"
                                                        style={{ transform: openGroups[group.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                                                    >
                                                        <polyline points="6 9 12 15 18 9"/>
                                                    </svg>
                                                </button>
                                                {openGroups[group.id] && (
                                                    <div className="admin-trans-fields">
                                                        {group.keys.map(({ key, label, multiline }) => (
                                                            <div key={key} className="admin-trans-field">
                                                                <label className="admin-trans-field-label">
                                                                    {label}
                                                                    <span className="admin-trans-field-key">{key}</span>
                                                                </label>
                                                                {multiline ? (
                                                                    <textarea
                                                                        rows={3}
                                                                        value={adminTranslations[transLangTab]?.[key] ?? ''}
                                                                        onChange={e => handleTranslationChange(transLangTab, key, e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={adminTranslations[transLangTab]?.[key] ?? ''}
                                                                        onChange={e => handleTranslationChange(transLangTab, key, e.target.value)}
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;

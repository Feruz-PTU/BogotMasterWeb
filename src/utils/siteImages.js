// The site's own images in several widths (folder 27). The smaller copies are
// made by scripts/optimize-images.mjs (`npm run images`) and committed; the
// browser picks the smallest one that is sharp at the size it is shown.

// The logo: 40-50 px in the navbar and the footer, 200-380 px on About. Above
// 400 px the original PNG is the smaller file.
export const LOGO = {
    src: '/Logo/new-logo.png',
    srcSet: '/Logo/logo-64.webp 64w, /Logo/logo-128.webp 128w, /Logo/logo-192.webp 192w, /Logo/logo-400.webp 400w, /Logo/new-logo.png 904w',
};

// The desktop hero (phones get their own picture, see Hero.jsx).
export const HERO_DESKTOP = {
    src: '/images/hero-bg-new.webp',
    srcSet: '/images/hero-bg-new-720.webp 720w, /images/hero-bg-new.webp 1080w',
    // 40% of the screen; 55% from 641 to 900 px (Hero.css).
    sizes: '(max-width: 900px) 55vw, 40vw',
};
export const HERO_MOBILE = '/images/mobile-main-hero-image.webp';
// The width at which Hero.css switches to the phone layout.
export const HERO_MOBILE_MEDIA = '(max-width: 640px)';

// The Glycyrrhiza glabra photo: at most 340 px wide.
export const PLANT_PHOTO = {
    src: '/images/Glycyrrhiza_glabra_Y03.webp',
    srcSet: '/images/Glycyrrhiza_glabra_Y03-360.webp 360w, /images/Glycyrrhiza_glabra_Y03-480.webp 480w, /images/Glycyrrhiza_glabra_Y03.webp 640w',
    sizes: '(max-width: 400px) 92vw, 340px',
};

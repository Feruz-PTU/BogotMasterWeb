/**
 * Photo sets a content page can show with a `{{photos-<name>}}` line
 * (ContentPage passes them to components/PagePhotos). Each photo is a gallery
 * photo, named by its Storage address, so its caption is the one edited in the
 * admin (Gallery tab) and the build makes its site copies. `date`, optional,
 * is when it was taken ('YYYY-MM-DD'), only when the photo shows it: a date
 * stamped on the picture, or the date a phone camera recorded in the file
 * (a phone's clock is set by the network). A camera's own clock may never
 * have been set, so its date is used only once the owner confirms it.
 *
 * Only the company's own photos: never the third-party plant photo.
 */
const GALLERY = 'https://ngppdjihprcsuugkyxnp.supabase.co/storage/v1/object/public/gallery/';

export const PAGE_PHOTOS = {
    // The origin page (folder 30): the yard in Bogot district.
    'origin-yard': [
        { src: `${GALLERY}image-1792247914496.webp` }, // raw root on the yard after delivery
    ],
    // The origin page: root dug in the field.
    'origin-field': [
        { src: `${GALLERY}image-1792247906321.webp` }, // wild root, dug up in the field
        { src: `${GALLERY}image-1792247908949.webp`, date: '2021-09-26' }, // a large wild root (date stamped on the photo)
    ],

    // The processing page (folder 31), one set per step. Dates of 19 Aug 2023
    // come from the phone camera; 21 Mar 2026 from the Canon camera (the owner
    // confirmed its clock, 25 Oct 2026).
    'processing-receiving': [
        { src: `${GALLERY}image-1792247908450.webp` }, // raw root stored under cover
    ],
    'processing-steaming': [
        { src: `${GALLERY}image-1792247909843.webp`, date: '2023-08-19' }, // the steaming tank, sticks beside it
    ],
    'processing-cutting': [
        { src: `${GALLERY}image-1792247912920.webp`, date: '2026-03-21' }, // cutting sticks by hand
        { src: `${GALLERY}image-1792247913476.webp`, date: '2026-03-21' }, // machine cutting into slices or tablets
        { src: `${GALLERY}image-1792247909334.webp`, date: '2023-08-19' }, // machine cutting sticks into tablets
    ],
    'processing-drying': [
        { src: `${GALLERY}image-1792247911231.webp`, date: '2023-08-19' }, // cut root drying in the open air
        { src: `${GALLERY}image-1792247913989.webp`, date: '2026-03-21' }, // checking dried cut root
    ],
    'processing-sorting': [
        { src: `${GALLERY}image-1792247910745.webp`, date: '2023-08-19' }, // rotating drum sieve cleaning sticks
    ],
    'processing-packing': [
        { src: `${GALLERY}image-1792247907910.webp` }, // bagging and weighing cut root
        { src: `${GALLERY}image-1792247912259.webp`, date: '2023-08-19' }, // pressing root into bales
    ],
};

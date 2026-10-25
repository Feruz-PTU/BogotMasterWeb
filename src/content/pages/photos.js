/**
 * Photo sets a content page can show with a `{{photos-<name>}}` line
 * (ContentPage passes them to components/PagePhotos). Each photo is a gallery
 * photo, named by its Storage address, so its caption is the one edited in the
 * admin (Gallery tab) and the build makes its site copies. `date`, optional,
 * is when it was taken ('YYYY-MM-DD'), only when the photo itself shows it.
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
};

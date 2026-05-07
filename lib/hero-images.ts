/**
 * Hero images from public folder.
 * First 3 = home page slider.
 * Remaining images = other page hero sections.
 */
export const HERO_IMAGES = [
  '/hero-bagfest.png',
  '/hero-photo-1.png',
  '/hero-photo-2.png',
  '/hero-photo-3.png',
  '/hero-photo-4.png',
  '/hero-photo-5.png',
  '/hero-photo-6.png',
  '/hero-photo-7.png',
  '/hero-photo-8.png',
  '/hero-photo-9.png',
  '/hero-photo-1.png',
] as const;

/** Home page slider (first 4) */
export const HERO_SLIDES_HOME = HERO_IMAGES.slice(0, 4);

/** For other pages' hero sections (remaining 14) */
export const HERO_IMAGES_OTHER_PAGES = HERO_IMAGES.slice(3);

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BADAWIA'S IMPORTS — Quality Imports Across Ghana",
    short_name: "BADAWIA'S",
    description: "Shop quality imports at BADAWIA'S IMPORTS — Ghana's trusted source for premium products. Direct imports, fast delivery across Tamale & Accra.",
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#0D1B45',
    orientation: 'portrait-primary',
    categories: ['shopping', 'lifestyle', 'business'],
    lang: 'en',
    icons: [
      { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    screenshots: [
      { src: '/og-image.png', sizes: '1200x630', type: 'image/png', label: "BADAWIA'S IMPORTS Homepage" },
    ],
    shortcuts: [
      { name: 'Shop', short_name: 'Shop', description: 'Browse products', url: '/shop', icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Categories', short_name: 'Categories', description: 'Browse categories', url: '/categories', icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Contact', short_name: 'Contact', description: 'Get in touch', url: '/contact', icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }] },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}

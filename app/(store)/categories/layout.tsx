import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categories',
  description: "Explore all product categories at BADAWIA'S IMPORTS. From fashion to electronics, homeware to beauty — quality imports for Tamale & Accra, Ghana.",
  keywords: ['product categories Ghana', 'shop by category', 'Ghana imports', 'fashion Ghana', 'electronics Ghana', 'homeware Tamale', 'beauty products Accra'],
  openGraph: {
    title: "Categories | BADAWIA'S IMPORTS",
    description: "Explore all categories — quality imports across Ghana.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Categories — BADAWIA'S IMPORTS", type: 'image/png' }],
    url: '/categories',
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Categories | BADAWIA'S IMPORTS",
    description: "Browse all product categories.",
    images: ['/opengraph-image'],
  },
  alternates: { canonical: '/categories' },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

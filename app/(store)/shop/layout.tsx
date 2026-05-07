import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop',
  description: "Browse the full collection at BADAWIA'S IMPORTS — quality products delivered across Ghana. Direct imports from China, wholesale & retail. Fast delivery to Tamale & Accra.",
  keywords: ['shop online Ghana', 'buy products Ghana', 'online store Tamale', 'Accra shopping', 'wholesale Ghana', 'direct imports', 'quality products Ghana', 'affordable imports'],
  openGraph: {
    title: "Shop | BADAWIA'S IMPORTS",
    description: "Browse quality imports. Wholesale & retail across Tamale & Accra, Ghana.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Shop — BADAWIA'S IMPORTS", type: 'image/png' }],
    url: '/shop',
    type: 'website',
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Shop | BADAWIA'S IMPORTS",
    description: "Browse our full collection — quality imports across Ghana.",
    images: [{ url: '/opengraph-image', alt: "Shop — BADAWIA'S IMPORTS" }],
  },
  alternates: { canonical: '/shop' },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

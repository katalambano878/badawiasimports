import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Information',
  description: "Shipping policy and delivery information for BADAWIA'S IMPORTS. Fast delivery across Ghana — Tamale, Accra, and nationwide. Track your orders.",
  keywords: ['shipping Ghana', 'delivery policy', 'fast delivery Tamale', 'Accra delivery', 'order tracking', 'nationwide shipping Ghana'],
  openGraph: {
    title: "Shipping | BADAWIA'S IMPORTS",
    description: "Fast, reliable delivery across Ghana.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Shipping — BADAWIA'S IMPORTS" }],
    url: '/shipping',
  },
  twitter: { card: 'summary_large_image', title: "Shipping | BADAWIA'S IMPORTS", images: ['/opengraph-image'] },
  alternates: { canonical: '/shipping' },
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

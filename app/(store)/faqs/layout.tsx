import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQs',
  description: "Frequently asked questions about BADAWIA'S IMPORTS — shipping, payment methods, returns, wholesale pricing, delivery times, and more.",
  keywords: ['FAQ', 'frequently asked questions', 'shipping Ghana', 'payment methods', 'returns policy', 'wholesale pricing', 'Badawia Imports help'],
  openGraph: {
    title: "FAQs | BADAWIA'S IMPORTS",
    description: "Find answers to common questions about orders, shipping, and returns.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "FAQs — BADAWIA'S IMPORTS" }],
    url: '/faqs',
  },
  twitter: { card: 'summary_large_image', title: "FAQs | BADAWIA'S IMPORTS", images: ['/opengraph-image'] },
  alternates: { canonical: '/faqs' },
};

export default function FAQsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

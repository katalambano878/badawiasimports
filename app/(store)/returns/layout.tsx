import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Exchanges',
  description: "Returns and exchange policy for BADAWIA'S IMPORTS. Easy returns process, conditions, and timelines for products purchased online or in-store.",
  keywords: ['returns policy Ghana', 'exchange policy', 'product returns', 'refund process', 'Badawia Imports returns'],
  openGraph: {
    title: "Returns | BADAWIA'S IMPORTS",
    description: "Our returns and exchange policy.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Returns — BADAWIA'S IMPORTS" }],
    url: '/returns',
  },
  twitter: { card: 'summary_large_image', title: "Returns | BADAWIA'S IMPORTS", images: ['/opengraph-image'] },
  alternates: { canonical: '/returns' },
};

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

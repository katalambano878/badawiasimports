import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: "Refund policy for BADAWIA'S IMPORTS. Learn about refund eligibility, timelines, and how to request a refund for your purchase.",
  keywords: ['refund policy', 'money back', 'refund Ghana', 'purchase refund', 'Badawia Imports refund'],
  openGraph: {
    title: "Refund Policy | BADAWIA'S IMPORTS",
    description: "Our refund policy and process.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Refund Policy — BADAWIA'S IMPORTS" }],
    url: '/refund-policy',
  },
  twitter: { card: 'summary_large_image', title: "Refund Policy | BADAWIA'S IMPORTS", images: ['/opengraph-image'] },
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

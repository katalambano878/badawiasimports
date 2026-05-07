import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: "Privacy policy for BADAWIA'S IMPORTS. How we collect, use, and protect your personal data when you shop with us.",
  keywords: ['privacy policy', 'data protection', 'personal information', 'Badawia Imports privacy', 'Ghana privacy policy'],
  openGraph: {
    title: "Privacy Policy | BADAWIA'S IMPORTS",
    description: "How we handle and protect your data.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Privacy Policy — BADAWIA'S IMPORTS" }],
    url: '/privacy',
  },
  twitter: { card: 'summary_large_image', title: "Privacy Policy | BADAWIA'S IMPORTS", images: ['/opengraph-image'] },
  alternates: { canonical: '/privacy' },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

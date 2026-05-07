import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: "Terms of service and conditions of use for BADAWIA'S IMPORTS. Your rights and responsibilities when shopping with us.",
  keywords: ['terms of service', 'terms and conditions', 'user agreement', 'Badawia Imports terms'],
  openGraph: {
    title: "Terms of Service | BADAWIA'S IMPORTS",
    description: "Terms and conditions for using our store.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Terms — BADAWIA'S IMPORTS" }],
    url: '/terms',
  },
  twitter: { card: 'summary_large_image', title: "Terms | BADAWIA'S IMPORTS", images: ['/opengraph-image'] },
  alternates: { canonical: '/terms' },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

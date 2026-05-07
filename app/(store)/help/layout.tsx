import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center',
  description: "Need help? Browse our help center for guides on ordering, shipping, payments, returns, and account management at BADAWIA'S IMPORTS.",
  keywords: ['help center', 'customer support', 'order help', 'shipping help', 'Badawia Imports support'],
  openGraph: {
    title: "Help Center | BADAWIA'S IMPORTS",
    description: "Find answers and get support.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Help — BADAWIA'S IMPORTS" }],
    url: '/help',
  },
  twitter: { card: 'summary_large_image', title: "Help | BADAWIA'S IMPORTS", images: ['/opengraph-image'] },
  alternates: { canonical: '/help' },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

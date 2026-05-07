import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: "Read the latest from BADAWIA'S IMPORTS — tips, guides, new arrivals, and insights on quality imports in Ghana.",
  keywords: ['blog', 'import tips Ghana', 'new arrivals', 'shopping guide', 'Badawia Imports blog', 'Ghana shopping tips'],
  openGraph: {
    title: "Blog | BADAWIA'S IMPORTS",
    description: "Tips, guides, and new arrivals.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Blog — BADAWIA'S IMPORTS" }],
    url: '/blog',
  },
  twitter: { card: 'summary_large_image', title: "Blog | BADAWIA'S IMPORTS", images: ['/opengraph-image'] },
  alternates: { canonical: '/blog' },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

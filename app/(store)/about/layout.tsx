import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: "Learn about BADAWIA'S IMPORTS — Ghana's trusted import company. Direct sourcing from premium manufacturers, flagship showrooms in Tamale and Accra. Our story, mission, and values.",
  keywords: ['about Badawia Imports', 'import company Ghana', 'our story', 'mission', 'Tamale business', 'Accra imports', 'direct sourcing Ghana', 'quality imports Ghana'],
  openGraph: {
    title: "About Us | BADAWIA'S IMPORTS",
    description: "Our story — quality imports serving Tamale and Accra, Ghana since 2020.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "About — BADAWIA'S IMPORTS", type: 'image/png' }],
    url: '/about',
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    title: "About Us | BADAWIA'S IMPORTS",
    description: "Our story and mission — quality imports across Ghana.",
    images: ['/opengraph-image'],
  },
  alternates: { canonical: '/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

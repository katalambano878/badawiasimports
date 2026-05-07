import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: "Get in touch with BADAWIA'S IMPORTS. Call or WhatsApp 0539781532, visit our showrooms in Tamale & Accra, or send us a message. We're here to help with orders, wholesale inquiries, and support.",
  keywords: ['contact Badawia Imports', 'customer service Ghana', 'Tamale showroom', 'Accra showroom', 'WhatsApp Ghana store', 'wholesale inquiries', 'phone 0539781532'],
  openGraph: {
    title: "Contact Us | BADAWIA'S IMPORTS",
    description: "Reach BADAWIA'S IMPORTS — Tamale & Accra, Ghana. Call 0539781532.",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Contact — BADAWIA'S IMPORTS", type: 'image/png' }],
    url: '/contact',
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Contact Us | BADAWIA'S IMPORTS",
    description: "Get in touch — Tamale & Accra, Ghana.",
    images: ['/opengraph-image'],
  },
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

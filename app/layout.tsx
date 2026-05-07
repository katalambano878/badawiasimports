import type { Metadata } from "next";
import Script from "next/script";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.badawiasimports.com').replace(/\/+$/, '');
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "BADAWIA'S IMPORTS";
const siteTagline = 'Quality Imports Across Ghana';
const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "Shop quality imports at BADAWIA'S IMPORTS — Ghana's trusted source for premium products. Direct imports, fast delivery across Tamale & Accra. Wholesale & retail.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | ${siteTagline}`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Badawia's Imports",
    'imports Ghana',
    'online store Ghana',
    'Tamale shopping',
    'Accra shopping',
    'quality imports',
    'wholesale Ghana',
    'direct imports China Ghana',
    'buy online Ghana',
    'Ghana e-commerce',
    'premium products Ghana',
    'Badawia Tamale',
    'Badawia Accra',
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: 'Shopping',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  openGraph: {
    type: 'website',
    locale: 'en',
    url: siteUrl,
    title: `${siteName} | ${siteTagline}`,
    description: siteDescription,
    siteName: siteName,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${siteName} — ${siteTagline}`,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | ${siteTagline}`,
    description: siteDescription,
    images: [{ url: '/opengraph-image', alt: `${siteName} — ${siteTagline}` }],
    creator: '@badawias_imports1',
    site: '@badawias_imports1',
  },
  alternates: {
    canonical: siteUrl,
  },
  other: {
    'theme-color': '#0D1B45',
    'msapplication-TileColor': '#0D1B45',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': siteName,
    'format-detection': 'telephone=no',
  },
};

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
// Google reCAPTCHA v3 Site Key
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.css"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout: fonts apply to all pages */}
        <link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

        {/* Organization Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": siteName,
          "url": siteUrl,
          "logo": { "@type": "ImageObject", "url": `${siteUrl}/logo.png`, "width": 512, "height": 512 },
          "image": `${siteUrl}/og-image.png`,
          "description": siteDescription,
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+233539781532",
            "contactType": "customer service",
            "availableLanguage": ["en"]
          },
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Tamale",
            "addressRegion": "Northern Region",
            "addressCountry": "GH"
          }
        })}} />

        {/* WebSite Schema with SearchAction */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": siteName,
          "url": siteUrl,
          "description": siteDescription,
          "inLanguage": "en",
          "potentialAction": {
            "@type": "SearchAction",
            "target": { "@type": "EntryPoint", "urlTemplate": `${siteUrl}/shop?search={search_term_string}` },
            "query-input": "required name=search_term_string"
          }
        })}} />

        {/* FAQ Schema for rich results */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Where are you located?", "acceptedAnswer": { "@type": "Answer", "text": "BADAWIA'S IMPORTS operates in Tamale and Accra, Ghana." } },
            { "@type": "Question", "name": "How can I contact the store?", "acceptedAnswer": { "@type": "Answer", "text": "Call or WhatsApp us on 0539781532, or reach us via the contact page." } },
            { "@type": "Question", "name": "What payment methods do you accept?", "acceptedAnswer": { "@type": "Answer", "text": "See checkout for available payment options." } }
          ]
        })}} />

        {/* LocalBusiness / Store schema for Google My Business */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify((() => {
          const phone = process.env.NEXT_PUBLIC_STORE_PHONE || '+233539781532';
          const email = process.env.NEXT_PUBLIC_STORE_EMAIL;
          const address = {
            '@type': 'PostalAddress',
            streetAddress: process.env.NEXT_PUBLIC_STORE_ADDRESS || 'Tamale & Accra',
            addressLocality: process.env.NEXT_PUBLIC_STORE_CITY || 'Tamale',
            addressRegion: process.env.NEXT_PUBLIC_STORE_REGION || 'Northern Region',
            addressCountry: process.env.NEXT_PUBLIC_STORE_COUNTRY || 'GH',
          };
          const sameAs = [
            process.env.NEXT_PUBLIC_FACEBOOK_URL,
            process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/badawias_imports',
            process.env.NEXT_PUBLIC_TIKTOK_URL || 'https://tiktok.com/@badawias_imports1',
            process.env.NEXT_PUBLIC_SNAPCHAT_URL || 'https://snapchat.com/add/badawia1234',
            process.env.NEXT_PUBLIC_TWITTER_URL,
          ].filter(Boolean);
          return {
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: siteName,
            description: siteDescription,
            url: siteUrl,
            image: `${siteUrl}/og-image.png`,
            logo: `${siteUrl}/logo.png`,
            priceRange: '$$',
            currenciesAccepted: 'GHS',
            paymentAccepted: 'Mobile Money, Card',
            openingHours: 'Mo-Sa 08:00-18:00',
            telephone: phone,
            ...(email && { email }),
            address,
            sameAs,
            potentialAction: {
              '@type': 'OrderAction',
              target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/shop` },
              deliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet',
            },
          };
        })())}} />
      </head>

      {/* Google Analytics */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Google reCAPTCHA v3 */}
      {RECAPTCHA_SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      )}

      <body className="antialiased font-sans overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <CartProvider>
          <WishlistProvider>
            <div id="main-content">
              {children}
            </div>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}

import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ProductDetailClient from './ProductDetailClient';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.badawiasimports.com').replace(/\/+$/, '');
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "BADAWIA'S IMPORTS";

async function getProduct(slug: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from('products')
      .select('name, description, images, price, category_id, metadata')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: `Product Not Found | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  const productUrl = `${SITE_URL}/product/${slug}`;
  const ogImage = product.images?.[0]?.url || '/opengraph-image';
  const title = `${product.name} | ${SITE_NAME}`;
  const description = product.description
    ? `${product.description.slice(0, 155)}...`
    : `Shop ${product.name}. Quality products, fast delivery.`;

  return {
    title: product.name,
    description,
    openGraph: {
      title,
      description,
      url: productUrl,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${product.name} — ${SITE_NAME}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: productUrl },
    keywords: [
      product.name,
      `buy ${product.name}`,
      `buy ${product.name} Ghana`,
      `${product.name} Tamale`,
      `${product.name} Accra`,
      'quality products Ghana',
      'online shopping Ghana',
      SITE_NAME,
    ],
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCMS } from '@/context/CMSContext';
import ProductCard, { type ColorVariant, getColorHex } from '@/components/ProductCard';
import AnimatedSection, { AnimatedGrid } from '@/components/AnimatedSection';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';
import { HERO_SLIDES_HOME } from '@/lib/hero-images';
import { optimizedImageUrl } from '@/lib/image-url';

function buildColorVariants(product: any): ColorVariant[] {
  const variants = product.product_variants || [];
  const result: ColorVariant[] = [];
  const seen = new Set<string>();
  for (const c of (product.metadata?.product_options?.color?.values || []) as string[]) {
    const [name, hex] = c.split('|');
    if (name && hex && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      result.push({ name: name.trim(), hex });
    }
  }
  for (const v of variants) {
    const n = (v as any).option2;
    if (n && !seen.has(n.toLowerCase())) {
      const hex = getColorHex(n);
      if (hex) { seen.add(n.toLowerCase()); result.push({ name: n.trim(), hex }); }
    }
  }
  return result;
}

export default function Home() {
  usePageTitle('');
  const { getSetting, getActiveBanners } = useCMS();

  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'new'>('featured');

  const HERO_SLIDES = HERO_SLIDES_HOME;
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  useEffect(() => {
    if (heroPaused) return;
    const t = setInterval(() => setHeroIndex(i => (i + 1) % HERO_SLIDES.length), 3500);
    return () => clearInterval(t);
  }, [heroPaused, HERO_SLIDES.length]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, newestRes, catsRes] = await Promise.all([
          fetch('/api/storefront/products?featured=true&limit=8'),
          fetch('/api/storefront/products?limit=8'),
          fetch('/api/storefront/categories'),
        ]);
        const featuredJson = featuredRes.ok ? await featuredRes.json() : null;
        const newestJson = newestRes.ok ? await newestRes.json() : null;
        const cats = catsRes.ok ? await catsRes.json() : [];
        const featured = Array.isArray(featuredJson) ? featuredJson : featuredJson?.products || [];
        const newest = Array.isArray(newestJson) ? newestJson : newestJson?.products || [];
        setFeaturedProducts(featured);
        setNewProducts(newest);
        const featCats = (cats || []).filter((c: any) => c.metadata?.featured).slice(0, 5);
        setCategories(featCats.length >= 4 ? featCats.slice(0, 4) : featCats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const heroHeadline = getSetting('hero_headline') || 'Excellence in Every Import';
  const heroSubheadline = getSetting('hero_subheadline') || 'Bridging global markets to Ghana with uncompromised quality and speed.';
  const heroPrimaryText = getSetting('hero_primary_btn_text') || 'Explore Collections';
  const heroPrimaryLink = getSetting('hero_primary_btn_link') || '/shop';
  const heroSecondaryText = getSetting('hero_secondary_btn_text') || 'The Journey';
  const heroSecondaryLink = getSetting('hero_secondary_btn_link') || '/about';
  const heroTagText = getSetting('hero_tag_text') || 'Premium Selection';
  const isSaleActive = getSetting('store_wide_sale_enabled') === 'true';
  const activeBanners = getActiveBanners('top');

  const displayProducts = activeTab === 'featured' ? featuredProducts : newProducts;
  const compactSectionY = 'py-12 md:py-16';

  return (
    <main className="min-h-screen bg-[#FDFDFD] overflow-x-hidden selection:bg-[#1ABCDF] selection:text-primary">

      {/* ── 0. God Mode Marquee ─────────────────────────────────────── */}
      <div className="bg-primary border-b border-white/10 text-white py-3 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-transparent to-primary z-10 pointer-events-none w-full" />
        {activeBanners.length > 0 ? (
          <div className="flex animate-marquee whitespace-nowrap">
            {[...activeBanners, ...activeBanners, ...activeBanners].map((b, i) => (
              <span key={i} className="mx-8 text-[11px] font-black tracking-[0.25em] uppercase flex items-center gap-4 text-white/90">
                <i className="ri-flashlight-fill text-[#1ABCDF]" />
                {b.title}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(3)].map((_, groupIndex) => (
              <div key={groupIndex} className="flex">
                {[
                  'TAMALE & ACCRA SHOWROOMS OPEN',
                  'DIRECT IMPORTS FROM CHINA',
                  'UNCOMPROMISED QUALITY',
                  'WHOLESALE DISCOUNTS AVAILABLE',
                  'PREMIUM LOGISTICS NETWORK',
                ].map((t, i) => (
                  <span key={i} className="mx-8 text-[11px] font-black tracking-[0.25em] uppercase flex items-center gap-4 text-white/90">
                    <i className="ri-flashlight-fill text-[#CC1414] animate-pulse" />
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 1. Hero: Cinematic ─────────────────────────────────────── */}
      <section 
        className="relative w-full h-[64svh] sm:h-[78svh] lg:h-[86svh] flex items-center overflow-hidden bg-[#060E28] group"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div className="sr-only" aria-hidden>
          {HERO_SLIDES.map((s, i) => (
            <img key={s} src={s} alt="" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
          ))}
        </div>

        {/* Dynamic Image Layers */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="sync">
            <motion.div
              key={heroIndex}
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <img
                src={HERO_SLIDES[heroIndex]}
                className="w-full h-full object-cover object-center filter saturate-[1.1] contrast-[1.05]"
                alt=""
                loading={heroIndex === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={heroIndex === 0 ? 'high' : 'low'}
              />
            </motion.div>
          </AnimatePresence>
          {/* Intense cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060E28]/40 via-transparent to-[#060E28]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060E28]/90 via-[#060E28]/30 to-transparent" />
          <div className="absolute inset-0 bg-[#060E28]/20 backdrop-blur-[2px]" />
        </div>

        {/* Floating Accent Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -right-[20vw] -top-[20vw] w-[60vw] h-[60vw] rounded-full border border-white/5 border-t-white/20 border-l-[#1ABCDF]/30 mix-blend-overlay z-0" 
        />

        {/* Content */}
        <motion.div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 flex justify-center">
          <div className="max-w-4xl flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="hidden sm:flex items-center justify-center gap-4 mb-6"
            >
              <div className="h-px w-16 bg-gradient-to-r from-[#1ABCDF] to-transparent" />
              <span className="text-[#1ABCDF] text-[11px] font-black tracking-[0.3em] uppercase drop-shadow-md">
                {heroTagText}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-white leading-tight tracking-tight mb-6"
            >
              Elevate Your <br />
              <span className="italic font-light opacity-90 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1ABCDF]">Lifestyle.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-white/60 text-base sm:text-xl font-sans font-light leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              {heroSubheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-6"
            >
              <Link
                href={heroPrimaryLink}
                className="group relative overflow-hidden inline-flex items-center gap-3 bg-white text-primary font-black px-10 py-4 rounded-full text-sm uppercase tracking-widest transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.5)]"
              >
                <div className="absolute inset-0 w-0 bg-[#1ABCDF] transition-all duration-500 ease-out group-hover:w-full z-0" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-500">{heroPrimaryText}</span>
                <i className="ri-arrow-right-line relative z-10 group-hover:text-white group-hover:translate-x-1 transition-all duration-500 text-lg" />
              </Link>
              <Link
                href={heroSecondaryLink}
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full border border-white/20 text-white/90 hover:text-white hover:border-white/60 hover:bg-white/10 backdrop-blur-sm font-medium uppercase tracking-widest text-xs transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)]"
              >
                {heroSecondaryText}
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Hero Slider Controls - Reimagined */}
        <div className="absolute bottom-10 right-4 sm:right-8 z-20 hidden sm:flex items-center gap-4">
          <div className="hidden sm:block text-white/30 font-black text-xs tracking-[0.2em] font-sans">
            <span className="text-white">{(heroIndex + 1).toString().padStart(2, '0')}</span> / {HERO_SLIDES.length.toString().padStart(2, '0')}
          </div>
          <div className="flex gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`relative h-[1.5px] transition-all duration-500 ${i === heroIndex ? 'w-10 bg-[#1ABCDF]' : 'w-5 bg-white/20 hover:bg-white/50'}`}
              >
                {i === heroIndex && (
                  <motion.div 
                    layoutId="heroIndicator" 
                    className="absolute inset-0 bg-[#1ABCDF] shadow-[0_0_10px_#1ABCDF]" 
                  />
                )}
              </button>
            ))}
          </div>
        </div>

      </section>

      {/* ── 2. Shop by Collection (compact grid) ──────────────────── */}
      <section className="py-20 md:py-24 bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="flex flex-col md:flex-row items-end justify-between gap-6 mb-10 md:mb-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-[2px] bg-[#CC1414]" />
                <span className="text-[#CC1414] font-black tracking-[0.2em] uppercase text-xs">Curated</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary leading-tight">
                Shop by <br className="hidden md:block" /> Collection
              </h2>
            </div>
            <Link href="/categories" className="group flex items-center gap-3 text-primary font-black uppercase text-xs tracking-widest">
              View All 
              <span className="w-10 h-[1px] bg-primary group-hover:w-16 transition-all duration-300" />
            </Link>
          </AnimatedSection>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-gray-100 bg-[#060E28] shadow-[0_10px_24px_-18px_rgba(13,27,69,0.35)] transition-all duration-500 hover:shadow-[0_18px_32px_-16px_rgba(13,27,69,0.45)]"
                >
                  <Image
                    src={cat.image_url || `https://placehold.co/800x1000/0D1B45/FFFFFF?text=${encodeURIComponent(cat.name)}`}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060E28]/95 via-[#060E28]/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Cyan accent bar that grows on hover */}
                  <span className="absolute left-3 top-3 h-1 w-6 rounded-full bg-[#1ABCDF] transition-all duration-500 group-hover:w-10" />

                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-serif text-sm sm:text-base font-bold leading-tight line-clamp-2">
                          {cat.name}
                        </h3>
                        <div className="mt-1.5 inline-flex items-center gap-1 border-b border-white/30 pb-0.5 text-[9px] font-black uppercase tracking-widest text-white transition-colors group-hover:border-[#1ABCDF] group-hover:text-[#1ABCDF]">
                          Explore
                          <i className="ri-arrow-right-line text-[11px] transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition-all duration-500 group-hover:border-[#1ABCDF] group-hover:bg-[#1ABCDF] group-hover:text-[#060E28]">
                        <i className="ri-arrow-right-up-line text-xs" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Exhibition Showcase (Products) ─────────────────────── */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex flex-col items-center text-center mb-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-[2px] bg-[#1ABCDF]" />
              <span className="text-primary font-black tracking-[0.2em] uppercase text-xs">Exhibition</span>
              <span className="w-8 h-[2px] bg-[#1ABCDF]" />
            </div>
            <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-10">Latest Arrivals</h2>
            
            <div className="flex items-center gap-6 pb-2 border-b border-gray-200">
              {(['featured', 'new'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative text-sm font-black uppercase tracking-widest pb-4 transition-colors ${
                    activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab === 'featured' ? 'Featured' : 'New Intake'}
                  {activeTab === tab && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </AnimatedSection>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-100 aspect-[3/4] mb-4" />
                  <div className="h-4 bg-gray-100 w-2/3 mb-2" />
                  <div className="h-4 bg-gray-100 w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 0.4 }}
              >
                {displayProducts.length > 0 ? (
                  <AnimatedGrid className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
                    {displayProducts.map(product => {
                      const variants = product.product_variants || [];
                      const hasVariants = variants.length > 0;
                      const minVariantPrice = hasVariants ? Math.min(...variants.map((v: any) => v.price || product.price)) : undefined;
                      const effectiveStock = hasVariants ? variants.reduce((s: number, v: any) => s + (v.quantity || 0), 0) : product.quantity;
                      return (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          slug={product.slug}
                          name={product.name}
                          price={product.price}
                          originalPrice={product.compare_at_price}
                          salePrice={product.sale_price || null}
                          isSaleActive={isSaleActive}
                          image={optimizedImageUrl(product.product_images?.[0]?.url, 600) || 'https://placehold.co/400x500/0D1B45/FFFFFF?text=Product'}
                          rating={product.rating_avg || 5}
                          reviewCount={product.review_count || 0}
                          badge={product.featured ? 'Iconic' : undefined}
                          inStock={effectiveStock > 0}
                          maxStock={effectiveStock || 50}
                          moq={product.moq || 1}
                          hasVariants={hasVariants}
                          minVariantPrice={minVariantPrice}
                          colorVariants={buildColorVariants(product)}
                          brand={product.brand || product.vendor}
                        />
                      );
                    })}
                  </AnimatedGrid>
                ) : (
                  <div className="py-32 text-center text-gray-300">
                    <p className="font-serif text-2xl italic">Inventory updating...</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          <div className="mt-20 text-center">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-4 bg-primary text-white font-black px-12 py-5 rounded-full text-sm uppercase tracking-widest transition-all hover:bg-primary-dark"
            >
              Enter The Store
              <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Terminal (Locations & Contact) ─────────────────────── */}
      <section className="hidden sm:block bg-[#F7F8FC] py-8 md:py-10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#060E28] via-[#0A1438] to-[#143D70] px-6 sm:px-8 lg:px-12 py-6 sm:py-7 lg:py-8">
            <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-20 -right-16 w-[240px] h-[240px] bg-white/10 rounded-full blur-3xl"
            />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-12 items-center">
              <div className="hidden lg:block">
                <span className="text-[#1ABCDF] font-black tracking-[0.2em] uppercase text-[11px] mb-2 block">Terminals</span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Strategic Hubs</h2>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { city: 'Tamale', desc: 'Flagship Showroom & Northern Logistics Hub.', icon: 'ri-map-pin-user-line' },
                    { city: 'Accra', desc: 'Greater Accra Distribution & Wholesale Center.', icon: 'ri-building-2-line' }
                  ].map((loc, i) => (
                    <div key={i} className="flex gap-3 group">
                      <div className="w-9 h-9 shrink-0 rounded-full border border-white/25 flex items-center justify-center group-hover:border-[#1ABCDF] group-hover:bg-[#1ABCDF]/10 transition-colors">
                        <i className={`${loc.icon} text-lg text-white/70 group-hover:text-[#1ABCDF] transition-colors`} />
                      </div>
                      <div>
                        <h3 className="text-base font-serif font-bold mb-0.5 leading-tight">{loc.city}</h3>
                        <p className="text-white/70 font-light text-xs leading-snug">{loc.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-6 lg:pl-6 lg:border-l lg:border-white/10">
                <div className="w-12 h-12 bg-white text-[#CC1414] flex items-center justify-center rounded-full shadow-xl shrink-0">
                  <i className="ri-whatsapp-fill text-2xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 leading-tight">Direct Line to Excellence.</h2>
                  <p className="text-white/80 font-light text-sm md:text-base mb-4 max-w-xl">
                    Skip the queues. Connect directly with our concierge team via WhatsApp for instant bulk quotes, custom sourcing, and support.
                  </p>
                  <a
                    href="https://wa.me/233539781532"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-white text-[#CC1414] font-black px-6 py-3 uppercase tracking-widest text-xs rounded-xl hover:bg-gray-100 transition-colors shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                  >
                    Start Conversation <i className="ri-arrow-right-up-line text-base" />
                  </a>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

    </main>
  );
}

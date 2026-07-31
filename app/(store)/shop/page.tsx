'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePageTitle } from '@/hooks/usePageTitle';
import ProductCard, { type ColorVariant } from '@/components/ProductCard';
import { getColorHex } from '@/components/ProductCard';
import { HERO_IMAGES_OTHER_PAGES } from '@/lib/hero-images';
import AnimatedSection from '@/components/AnimatedSection';
import { motion, AnimatePresence } from 'framer-motion';
import { useCMS } from '@/context/CMSContext';
import { optimizedImageUrl } from '@/lib/image-url';

function ShopContent() {
  usePageTitle('Shop All Products');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Data
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([{ id: 'all', name: 'All Products', count: 0 }]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters / UI state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const productsPerPage = 9;

  const toolbarRef = useRef<HTMLDivElement>(null);
  const { getSetting } = useCMS();
  const isSaleActive = getSetting('store_wide_sale_enabled') === 'true';

  // Initialize from URL params
  useEffect(() => {
    const category = searchParams?.get('category');
    const sort = searchParams?.get('sort');
    if (category) setSelectedCategory(category);
    if (sort) setSortBy(sort);
  }, [searchParams]);

  // Fetch Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/storefront/categories');
        if (res.ok) {
          const data = await res.json();
          if (data) setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch Products via cached storefront API (avoids heavy browser→/rest/v1 embeds)
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const search = searchParams?.get('search') || '';
        const qs = new URLSearchParams({
          limit: String(productsPerPage),
          page: String(page),
          sort: sortBy,
        });
        if (search) qs.set('search', search);
        if (selectedCategory !== 'all') qs.set('category', selectedCategory);

        const res = await fetch(`/api/storefront/products?${qs.toString()}`);
        if (!res.ok) throw new Error('Failed to load products');
        const payload = await res.json();
        const data = Array.isArray(payload) ? payload : payload.products || [];
        const count = Array.isArray(payload) ? data.length : payload.count || 0;

        const formattedProducts = data
          .map((p: any) => {
            const variants = p.product_variants || [];
            const hasVariants = variants.length > 0;
            const minVariantPrice = hasVariants ? Math.min(...variants.map((v: any) => v.price || p.price)) : undefined;
            const totalVariantStock = hasVariants ? variants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) : 0;
            const effectiveStock = hasVariants ? totalVariantStock : p.quantity;
            const colorVariants: ColorVariant[] = [];
            const seenColors = new Set<string>();
            const metaColors = (p.metadata?.product_options?.color?.values || []) as string[];
            for (const c of metaColors) {
              const [cName, cHex] = c.split('|');
              if (cName && cHex && !seenColors.has(cName.toLowerCase().trim())) {
                seenColors.add(cName.toLowerCase().trim());
                colorVariants.push({ name: cName.trim(), hex: cHex });
              }
            }
            for (const v of variants) {
              const colorName = v.option2;
              if (colorName && !seenColors.has(colorName.toLowerCase().trim())) {
                const hex = getColorHex(colorName);
                if (hex) {
                  seenColors.add(colorName.toLowerCase().trim());
                  colorVariants.push({ name: colorName.trim(), hex });
                }
              }
            }

            const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;

            return {
              id: p.id,
              slug: p.slug,
              name: p.name,
              price: p.price,
              originalPrice: p.compare_at_price,
              salePrice: p.sale_price || null,
              image: optimizedImageUrl(p.product_images?.[0]?.url, 600) || 'https://via.placeholder.com/800x800?text=No+Image',
              rating: p.rating_avg || 0,
              reviewCount: 0,
              badge: p.compare_at_price > p.price ? 'Sale' : undefined,
              inStock: effectiveStock > 0,
              maxStock: effectiveStock || 50,
              moq: p.moq || 1,
              category: cat?.name,
              hasVariants,
              minVariantPrice,
              colorVariants,
              _price: Number(p.price) || 0,
              _rating: Number(p.rating_avg) || 0,
              _qty: Number(effectiveStock) || 0,
            };
          })
          .filter((p: any) => {
            if (priceRange[0] > 0 && p._price < priceRange[0]) return false;
            if (priceRange[1] < 5000 && p._price > priceRange[1]) return false;
            if (selectedRating > 0 && p._rating < selectedRating) return false;
            if (inStockOnly && p._qty <= 0) return false;
            return true;
          });

        setProducts(formattedProducts);
        setTotalProducts(count || 0);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [selectedCategory, priceRange, selectedRating, inStockOnly, sortBy, page, searchParams]);

  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const currentSearch = searchParams?.get('search') || '';
  const topLevelCategories = useMemo(
    () => categories.filter(c => c.id !== 'all' && !c.parent_id),
    [categories]
  );
  const activeCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return 'All Products';
    return categories.find(c => c.slug === selectedCategory)?.name || 'All Products';
  }, [categories, selectedCategory]);

  const clearAll = () => {
    setSelectedCategory('all');
    setPriceRange([0, 5000]);
    setSelectedRating(0);
    setInStockOnly(false);
    setSortBy('popular');
    setPage(1);
  };

  const activeFilterChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (currentSearch) activeFilterChips.push({ key: 'search', label: `Search: "${currentSearch}"`, onRemove: () => router.push('/shop') });
  if (selectedCategory !== 'all') activeFilterChips.push({ key: 'cat', label: activeCategoryName, onRemove: () => { setSelectedCategory('all'); setPage(1); } });
  if (priceRange[0] > 0 || priceRange[1] < 5000) activeFilterChips.push({ key: 'price', label: `GH₵${priceRange[0]} – GH₵${priceRange[1]}${priceRange[1] === 5000 ? '+' : ''}`, onRemove: () => setPriceRange([0, 5000]) });
  if (selectedRating > 0) activeFilterChips.push({ key: 'rating', label: `${selectedRating}+ stars`, onRemove: () => setSelectedRating(0) });
  if (inStockOnly) activeFilterChips.push({ key: 'stock', label: 'In stock only', onRemove: () => setInStockOnly(false) });

  const pageNumbers = useMemo(() => {
    const pages: (number | 'dots')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('dots');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('dots');
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      {/* ── Editorial Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#060E28] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={HERO_IMAGES_OTHER_PAGES[0]}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_left,_#1ABCDF_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_bottom_right,_#CC1414_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-[#1ABCDF]/10 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 md:pt-24 md:pb-20">
          <nav className="text-xs text-white/50 font-black tracking-[0.2em] uppercase mb-5 md:mb-8 flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <i className="ri-arrow-right-s-line" />
            <span className="text-[#1ABCDF]">Shop</span>
            {selectedCategory !== 'all' && (
              <>
                <i className="ri-arrow-right-s-line" />
                <span className="text-white">{activeCategoryName}</span>
              </>
            )}
          </nav>

          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 items-end">
            <div>
              <div className="flex items-center gap-3 mb-3 md:mb-5">
                <span className="h-px w-12 bg-[#1ABCDF]" />
                <span className="text-[#1ABCDF] text-[11px] font-black tracking-[0.3em] uppercase">The Collection</span>
              </div>
              <h1 className="font-serif font-bold leading-[1.05] tracking-tight text-4xl md:text-6xl lg:text-7xl">
                {currentSearch ? (
                  <>Results for <span className="italic font-light text-[#1ABCDF]">"{currentSearch}"</span></>
                ) : (
                  <>Curated <br className="hidden md:block" /><span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-white to-[#1ABCDF]">Essentials.</span></>
                )}
              </h1>
              <p className="mt-3 md:mt-5 text-white/60 text-sm md:text-lg font-light max-w-xl">
                Hand-picked imports spanning lifestyle, tech, fashion & home — delivered across Ghana with precision.
              </p>
            </div>

            <div className="flex flex-col gap-5 mt-5 lg:mt-0">
              {/* Inline live stats */}
              <div className="flex flex-wrap gap-2 md:gap-3">
                <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur px-3 py-2 md:px-5 md:py-3">
                  <div className="text-[9px] md:text-[10px] tracking-[0.25em] font-black uppercase text-white/40">Products</div>
                  <div className="font-serif text-lg md:text-2xl font-bold text-white">{totalProducts.toLocaleString()}</div>
                </div>
                <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur px-3 py-2 md:px-5 md:py-3">
                  <div className="text-[9px] md:text-[10px] tracking-[0.25em] font-black uppercase text-white/40">Categories</div>
                  <div className="font-serif text-lg md:text-2xl font-bold text-white">{topLevelCategories.length}</div>
                </div>
                <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur px-3 py-2 md:px-5 md:py-3">
                  <div className="text-[9px] md:text-[10px] tracking-[0.25em] font-black uppercase text-white/40">Ships</div>
                  <div className="font-serif text-lg md:text-2xl font-bold text-white">GH‑wide</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Category Shelf (horizontal rail) ─────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[10px] font-black tracking-[0.25em] text-gray-400 uppercase whitespace-nowrap">
              Shelf
            </span>
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 w-max">
                <button
                  onClick={() => { setSelectedCategory('all'); setPage(1); }}
                  className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white border-primary shadow-[0_8px_20px_-8px_rgba(13,27,69,0.6)]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  All
                </button>
                {topLevelCategories.map(cat => {
                  const active = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                      className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${
                        active
                          ? 'bg-primary text-white border-primary shadow-[0_8px_20px_-8px_rgba(13,27,69,0.6)]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {cat.name}
                      {typeof cat.count === 'number' && cat.count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {cat.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────── */}
      <section className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Toolbar */}
          <div
            ref={toolbarRef}
            className="flex flex-wrap items-center justify-between gap-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 bg-white hover:border-primary hover:text-primary transition-colors"
              >
                <i className="ri-equalizer-2-line" />
                <span className="text-xs font-black uppercase tracking-widest">Refine</span>
              </button>
              <p className="hidden sm:block text-sm text-gray-600">
                Showing <span className="font-bold text-primary">{products.length}</span> of <span className="font-bold text-primary">{totalProducts}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* View toggle */}
              <div className="hidden sm:flex items-center rounded-full border border-gray-200 p-1 bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-500 hover:text-primary'}`}
                >
                  <i className="ri-grid-fill" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-500 hover:text-primary'}`}
                >
                  <i className="ri-list-check-2" />
                </button>
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="appearance-none pl-5 pr-10 py-3 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-primary transition-colors"
                >
                  <option value="popular">Most Popular</option>
                  <option value="new">Newest</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {activeFilterChips.map(chip => (
                <button
                  key={chip.key}
                  onClick={chip.onRemove}
                  className="group inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-[#CC1414] hover:text-[#CC1414] transition-colors"
                >
                  {chip.label}
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-[#CC1414] group-hover:text-white transition-colors">
                    <i className="ri-close-line text-[11px]" />
                  </span>
                </button>
              ))}
              <button
                onClick={clearAll}
                className="text-xs font-black uppercase tracking-widest text-[#CC1414] hover:text-primary transition-colors ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="flex gap-10">
            {/* ── Sidebar / Refine ─────────────────────────── */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-28 rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(13,27,69,0.2)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-bold text-primary">Refine</h2>
                  <button
                    onClick={clearAll}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#CC1414] transition-colors"
                  >
                    Reset
                  </button>
                </div>

                <FilterGroups
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={(c) => { setSelectedCategory(c); setPage(1); }}
                  priceRange={priceRange}
                  setPriceRange={(p) => { setPriceRange(p); setPage(1); }}
                  selectedRating={selectedRating}
                  setSelectedRating={(r) => { setSelectedRating(r); setPage(1); }}
                  inStockOnly={inStockOnly}
                  setInStockOnly={(v) => { setInStockOnly(v); setPage(1); }}
                />
              </div>
            </aside>

            {/* ── Products Area ──────────────────────────── */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className={`grid gap-3 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`bg-gray-100 animate-pulse rounded-3xl ${viewMode === 'grid' ? 'aspect-[4/5]' : 'h-48'}`}
                    />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-24 rounded-3xl border border-dashed border-gray-200 bg-white">
                  <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6 bg-[#F7F8FC] rounded-full">
                    <i className="ri-inbox-line text-4xl text-gray-400" />
                  </div>
                  <h3 className="font-serif text-3xl font-bold text-primary mb-2">No products found</h3>
                  <p className="text-gray-500 mb-8">Try changing a filter or browsing another category.</p>
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-3 bg-primary text-white font-black px-8 py-4 rounded-full uppercase tracking-widest text-xs hover:bg-[#1ABCDF] transition-colors"
                  >
                    Clear all filters <i className="ri-refresh-line" />
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${viewMode}-${page}-${selectedCategory}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`grid gap-3 sm:gap-6 md:gap-8 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
                    data-product-shop
                  >
                    {products.map((product) =>
                      viewMode === 'grid' ? (
                        <ProductCard key={product.id} {...product} isSaleActive={isSaleActive} />
                      ) : (
                        <ProductListCard key={product.id} product={product} />
                      )
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-14 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-11 h-11 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="ri-arrow-left-s-line text-lg" />
                  </button>
                  {pageNumbers.map((p, idx) =>
                    p === 'dots' ? (
                      <span key={`d${idx}`} className="w-11 h-11 flex items-center justify-center text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-11 h-11 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                          p === page
                            ? 'bg-primary text-white shadow-[0_8px_20px_-8px_rgba(13,27,69,0.6)]'
                            : 'border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-11 h-11 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="ri-arrow-right-s-line text-lg" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile Refine Drawer ─────────────────────────────── */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsFilterOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-white rounded-t-3xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 p-5 flex items-center justify-between z-10">
                <h2 className="font-serif text-2xl font-bold text-primary">Refine</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                >
                  <i className="ri-close-line text-xl" />
                </button>
              </div>
              <div className="p-6 pb-36">
                <FilterGroups
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={(c) => { setSelectedCategory(c); setPage(1); }}
                  priceRange={priceRange}
                  setPriceRange={(p) => { setPriceRange(p); setPage(1); }}
                  selectedRating={selectedRating}
                  setSelectedRating={(r) => { setSelectedRating(r); setPage(1); }}
                  inStockOnly={inStockOnly}
                  setInStockOnly={(v) => { setInStockOnly(v); setPage(1); }}
                />
              </div>
              <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => { clearAll(); }}
                  className="flex-1 py-4 rounded-full border border-gray-200 text-primary font-black uppercase tracking-widest text-xs hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-4 rounded-full bg-primary text-white font-black uppercase tracking-widest text-xs hover:bg-[#1ABCDF] transition-colors"
                >
                  Show {totalProducts}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ── Refine content (shared for sidebar + mobile) ─────────── */
function FilterGroups({
  categories,
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  selectedRating,
  setSelectedRating,
  inStockOnly,
  setInStockOnly,
}: {
  categories: any[];
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  priceRange: [number, number];
  setPriceRange: (p: [number, number]) => void;
  selectedRating: number;
  setSelectedRating: (n: number) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-400 mb-3">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === 'all' ? 'bg-primary/5 text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
          {categories.filter(c => !c.parent_id && c.id !== 'all').map(parent => {
            const subcategories = categories.filter(c => c.parent_id === parent.id);
            const isSelected = selectedCategory === parent.slug;
            const isChildSelected = subcategories.some(sub => sub.slug === selectedCategory);
            return (
              <div key={parent.id} className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(parent.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                    isSelected ? 'bg-primary/5 text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{parent.name}</span>
                  {subcategories.length > 0 && (
                    <i className={`ri-arrow-down-s-line text-gray-400 transition-transform ${isSelected || isChildSelected ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {subcategories.length > 0 && (isSelected || isChildSelected) && (
                  <div className="ml-3 border-l border-gray-100 pl-3 space-y-0.5">
                    {subcategories.map(child => (
                      <button
                        key={child.id}
                        onClick={() => setSelectedCategory(child.slug)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedCategory === child.slug ? 'text-primary font-bold bg-primary/5' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-400 mb-3">Price Range</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 rounded-xl bg-[#F7F8FC] px-3 py-2">
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400">Min</div>
            <div className="font-bold text-primary text-sm">GH₵{priceRange[0]}</div>
          </div>
          <div className="flex-1 rounded-xl bg-[#F7F8FC] px-3 py-2">
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400">Max</div>
            <div className="font-bold text-primary text-sm">GH₵{priceRange[1]}{priceRange[1] === 5000 ? '+' : ''}</div>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={5000}
          step={50}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Rating */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-400 mb-3">Rating</h3>
        <div className="space-y-1">
          {[4, 3, 2, 1].map(rating => (
            <button
              key={rating}
              onClick={() => setSelectedRating(rating === selectedRating ? 0 : rating)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedRating === rating ? 'bg-primary/5 text-primary' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <i
                    key={star}
                    className={`${star <= rating ? 'ri-star-fill text-amber-400' : 'ri-star-line text-gray-300'} text-sm`}
                  />
                ))}
              </div>
              <span className="text-xs">& up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-400 mb-3">Availability</h3>
        <label className="flex items-center justify-between cursor-pointer select-none">
          <span className="text-sm text-gray-700">In stock only</span>
          <span className={`relative w-11 h-6 rounded-full transition-colors ${inStockOnly ? 'bg-primary' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${inStockOnly ? 'translate-x-5' : 'translate-x-0'}`} />
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
        </label>
      </div>
    </div>
  );
}

/* ── List view card ────────────────────────────────────────── */
function ProductListCard({ product }: { product: any }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex gap-5 rounded-3xl border border-gray-100 bg-white p-4 hover:shadow-[0_20px_40px_-20px_rgba(13,27,69,0.2)] hover:border-primary/30 transition-all"
    >
      <div className="relative w-40 h-40 sm:w-52 sm:h-52 flex-shrink-0 rounded-2xl overflow-hidden bg-[#F7F8FC]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 text-[10px] tracking-widest font-black uppercase bg-[#CC1414] text-white px-2 py-1 rounded-full">
            {product.badge}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        {product.category && (
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-400 mb-1">{product.category}</span>
        )}
        <h3 className="font-serif font-bold text-primary text-lg sm:text-xl leading-snug line-clamp-2 group-hover:text-[#1ABCDF] transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 my-2">
          {[1, 2, 3, 4, 5].map(s => (
            <i key={s} className={`${s <= Math.round(product.rating || 0) ? 'ri-star-fill text-amber-400' : 'ri-star-line text-gray-300'} text-sm`} />
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold text-primary">
              GH₵{(product.minVariantPrice ?? product.price)?.toLocaleString?.() ?? product.price}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">GH₵{product.originalPrice}</span>
            )}
          </div>
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
              product.inStock ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {product.inStock ? 'In stock' : 'Sold out'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}

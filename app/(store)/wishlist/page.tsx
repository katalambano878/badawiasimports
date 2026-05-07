'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useWishlist, type WishlistItem } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import ScrollReveal from '@/components/ScrollReveal';
import { usePageTitle } from '@/hooks/usePageTitle';
import { HERO_IMAGES_OTHER_PAGES } from '@/lib/hero-images';

type SortKey = 'recent' | 'price-asc' | 'price-desc' | 'name';
type ViewMode = 'grid' | 'list';

const SORT_LABEL: Record<SortKey, string> = {
  recent: 'Recently Added',
  'price-asc': 'Price · Low to High',
  'price-desc': 'Price · High to Low',
  name: 'Name · A–Z',
};

export default function WishlistPage() {
  usePageTitle('Wishlist');
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useState<ViewMode>('grid');

  const sortedList = useMemo(() => {
    const list = [...wishlist];
    switch (sort) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list; // preserves insertion order (most recent last)
    }
  }, [wishlist, sort]);

  const totals = useMemo(() => {
    const count = wishlist.length;
    const subtotal = wishlist.reduce((s, i) => s + i.price, 0);
    const originalTotal = wishlist.reduce(
      (s, i) => s + (i.originalPrice && i.originalPrice > i.price ? i.originalPrice : i.price),
      0,
    );
    const savings = Math.max(0, originalTotal - subtotal);
    const inStock = wishlist.filter((i) => i.inStock).length;
    const onSale = wishlist.filter((i) => i.originalPrice && i.originalPrice > i.price).length;
    return { count, subtotal, savings, originalTotal, inStock, onSale };
  }, [wishlist]);

  const hasItems = wishlist.length > 0;

  const handleMoveToCart = (item: WishlistItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      slug: item.slug,
      maxStock: item.inStock ? 50 : 0,
      moq: 1,
    });
    removeFromWishlist(item.id);
  };

  const handleMoveAllToCart = () => {
    wishlist
      .filter((i) => i.inStock)
      .forEach((item) => {
        addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
          slug: item.slug,
          maxStock: 50,
          moq: 1,
        });
        removeFromWishlist(item.id);
      });
  };

  const formatPrice = (value: number) =>
    `GH₵${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      {/* ── Cinematic Hero ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#060E28] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={HERO_IMAGES_OTHER_PAGES[4]}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top_left,_#CC1414_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_right,_#1ABCDF_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="absolute -top-40 -left-20 h-[420px] w-[420px] rounded-full bg-[#CC1414]/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-20 h-[420px] w-[420px] rounded-full bg-[#1ABCDF]/10 blur-3xl animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-14 md:pt-24 md:pb-20">
          <nav className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/50">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <i className="ri-arrow-right-s-line" />
            <span className="text-[#1ABCDF]">Wishlist</span>
          </nav>

          <div className="grid items-end gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-12 bg-[#CC1414]" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#CC1414]">
                  Saved for Later
                </span>
              </div>
              <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                Your{' '}
                <span className="italic font-light bg-gradient-to-r from-white to-[#CC1414] bg-clip-text text-transparent">
                  {hasItems ? 'Curations.' : 'Wishlist.'}
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base font-light text-white/60 md:text-lg">
                {hasItems
                  ? 'Your personal edit — thoughtfully saved. Ready when you are.'
                  : 'Heart items you love to build a personal collection. They’ll live here until you’re ready.'}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {hasItems ? (
                  <>
                    <button
                      type="button"
                      onClick={handleMoveAllToCart}
                      disabled={totals.inStock === 0}
                      className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-primary transition-all duration-500 hover:-translate-y-0.5 hover:bg-[#1ABCDF] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <i className="ri-shopping-bag-3-line" />
                      Move All to Cart
                    </button>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/[0.04] px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:border-white/60 hover:bg-white/10"
                    >
                      Keep Shopping
                      <i className="ri-arrow-right-line" />
                    </Link>
                  </>
                ) : (
                  <>
              <Link
                href="/shop"
                      className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-primary transition-all duration-500 hover:-translate-y-0.5 hover:bg-[#1ABCDF] hover:text-white"
                    >
                      Browse the Shop
                      <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      href="/categories"
                      className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/[0.04] px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:border-white/60 hover:bg-white/10"
                    >
                      Explore Collections
              </Link>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStat label="Items" value={String(totals.count)} />
              <HeroStat label="Total Value" value={formatPrice(totals.subtotal)} compact />
              <HeroStat label="In Stock" value={`${totals.inStock} / ${totals.count || 0}`} />
              <HeroStat label="On Sale" value={String(totals.onSale)} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ──────────────────────────────────────────── */}
      {hasItems ? (
        <section className="py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
              {/* Main column */}
              <div>
                {/* Toolbar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-serif text-lg font-bold text-primary">
                      {totals.count}
                    </span>{' '}
                    item{totals.count !== 1 ? 's' : ''} in your wishlist
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                        className="appearance-none rounded-full border border-gray-200 bg-[#F7F8FC] pl-4 pr-9 py-2 text-xs font-black uppercase tracking-widest text-gray-700 outline-none transition-colors hover:border-primary focus:border-primary"
                      >
                        {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                          <option key={k} value={k}>
                            {SORT_LABEL[k]}
                          </option>
                        ))}
                      </select>
                      <i className="ri-arrow-down-s-line pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    </div>

                    <div className="flex items-center rounded-full border border-gray-200 bg-[#F7F8FC] p-1">
                      <button
                        type="button"
                        onClick={() => setView('grid')}
                        aria-label="Grid view"
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                          view === 'grid'
                            ? 'bg-primary text-white'
                            : 'text-gray-500 hover:text-primary'
                        }`}
                      >
                        <i className="ri-grid-line" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setView('list')}
                        aria-label="List view"
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                          view === 'list'
                            ? 'bg-primary text-white'
                            : 'text-gray-500 hover:text-primary'
                        }`}
                      >
                        <i className="ri-list-unordered" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={clearWishlist}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50"
                    >
                      <i className="ri-delete-bin-6-line" /> Clear
                    </button>
                  </div>
                </div>

                {/* Items */}
                <AnimatePresence mode="popLayout">
                  {view === 'grid' ? (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {sortedList.map((item) => (
                        <WishlistCardGrid
                          key={item.id}
                          item={item}
                          onMove={handleMoveToCart}
                          onRemove={removeFromWishlist}
                          formatPrice={formatPrice}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col gap-4"
                    >
                      {sortedList.map((item) => (
                        <WishlistCardList
                          key={item.id}
                          item={item}
                          onMove={handleMoveToCart}
                          onRemove={removeFromWishlist}
                          formatPrice={formatPrice}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Summary */}
              <aside className="lg:sticky lg:top-28 self-start">
                <ScrollReveal>
                  <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(13,27,69,0.25)]">
              <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CC1414]/10 text-[#CC1414]">
                        <i className="ri-heart-3-fill text-lg" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                          Wishlist Snapshot
                        </p>
                        <p className="font-serif text-lg font-bold text-primary">
                          Ready when you are
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3 text-sm">
                      <SummaryRow label="Items" value={String(totals.count)} />
                      <SummaryRow label="In Stock" value={`${totals.inStock}`} />
                      <SummaryRow label="On Sale" value={`${totals.onSale}`} />
                      <div className="my-3 border-t border-gray-100" />
                      {totals.savings > 0 && (
                        <SummaryRow
                          label="You’re saving"
                          value={`−${formatPrice(totals.savings)}`}
                          accent
                        />
                      )}
                      <SummaryRow
                        label="Total value"
                        value={formatPrice(totals.subtotal)}
                        bold
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleMoveAllToCart}
                      disabled={totals.inStock === 0}
                      className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#1ABCDF] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <i className="ri-shopping-bag-3-line text-base" />
                      Move All to Cart
                    </button>

                <Link
                  href="/cart"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-700 transition-colors hover:border-primary hover:text-primary"
                >
                  Go to Cart
                      <i className="ri-arrow-right-line" />
                    </Link>

                    <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
                      Your wishlist stays saved on this device. Sign in to sync it across devices.
                    </p>
                  </div>
                </ScrollReveal>

                {/* Perks */}
                <ScrollReveal>
                  <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#060E28] via-[#0A1438] to-[#1ABCDF]/30 p-6 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
                      Shopping Perks
                    </p>
                    <h3 className="mt-1 font-serif text-xl font-bold">Why save for later?</h3>
                    <ul className="mt-4 space-y-3 text-sm text-white/80">
                      <PerkItem icon="ri-notification-3-line" text="Get notified on price drops & restocks" />
                      <PerkItem icon="ri-gift-line" text="Claim loyalty rewards on saved items" />
                      <PerkItem icon="ri-share-line" text="Share your edit with friends & family" />
                    </ul>
                  </div>
                </ScrollReveal>
              </aside>
            </div>
          </div>
        </section>
      ) : (
        <EmptyState />
      )}

      {/* ── Closing concierge card ─────────────────────────── */}
      <section className="py-12 md:py-16 bg-[#F7F8FC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#060E28] via-[#0A1438] to-[#143D70] p-6 sm:p-8 lg:p-10 text-white">
              <div className="absolute inset-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
              <div className="absolute -top-28 -right-16 h-[300px] w-[300px] rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/90 backdrop-blur">
                    <i className="ri-sparkling-2-line text-[#1ABCDF]" /> Personal Concierge
                  </span>
                  <h2 className="mt-4 font-serif text-3xl md:text-4xl font-bold leading-tight">
                    Looking for something specific?
                  </h2>
                  <p className="mt-3 max-w-lg text-base font-light text-white/70">
                    Can’t find the piece you’ve been dreaming of? Our concierge team sources imports
                    across West Africa. Let’s bring yours home.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <Link
                    href="/contact"
                    className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-7 py-4 text-xs font-black uppercase tracking-widest text-primary transition-colors hover:bg-[#1ABCDF] hover:text-white md:w-auto"
                  >
                    Talk to Concierge
                    <i className="ri-arrow-right-up-line text-base transition-transform group-hover:translate-x-0.5" />
                </Link>
                  <Link
                    href="/shop"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/25 bg-white/[0.04] px-7 py-4 text-xs font-black uppercase tracking-widest text-white transition-colors hover:border-white/60 hover:bg-white/10 md:w-auto"
                  >
                    Browse Shop
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}

/* ─────────── Components ─────────── */

function HeroStat({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur">
      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">{label}</div>
      <div
        className={`mt-1 font-serif font-bold text-white ${
          compact ? 'text-lg leading-tight' : 'text-2xl'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
  accent = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-widest text-gray-500">{label}</span>
      <span
        className={`${
          bold ? 'font-serif text-lg font-bold text-primary' : 'font-semibold text-gray-800'
        } ${accent ? 'text-emerald-600 font-semibold' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function PerkItem({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[#1ABCDF]">
        <i className={icon} />
      </span>
      <span className="leading-snug">{text}</span>
    </li>
  );
}

function WishlistCardGrid({
  item,
  onMove,
  onRemove,
  formatPrice,
}: {
  item: WishlistItem;
  onMove: (i: WishlistItem) => void;
  onRemove: (id: string) => void;
  formatPrice: (n: number) => string;
}) {
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const discountPct = hasDiscount
    ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex h-full flex-col"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#F7F8FC]">
        <Link href={`/product/${item.slug}`} className="block h-full w-full">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover object-top transition-transform duration-700 group-hover:scale-105 ${
              !item.inStock ? 'grayscale' : ''
            }`}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </Link>

        {/* Badge stack */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="rounded-full bg-[#CC1414] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              −{discountPct}%
            </span>
          )}
          {!item.inStock && (
            <span className="rounded-full bg-gray-900/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur">
              Sold Out
            </span>
          )}
          {item.badge && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary backdrop-blur">
              {item.badge}
            </span>
          )}
        </div>

        {/* Remove */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label="Remove from wishlist"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#CC1414] shadow-sm backdrop-blur transition-colors hover:bg-[#CC1414] hover:text-white"
        >
          <i className="ri-heart-3-fill" />
        </button>

        {/* Hover CTA */}
        {item.inStock && (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onMove(item)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-[11px] font-black uppercase tracking-widest text-primary shadow-lg transition-colors hover:bg-primary hover:text-white"
            >
              <i className="ri-shopping-bag-3-line" /> Move to Cart
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-grow flex-col pt-4">
        <div className="flex items-center gap-2">
          {typeof item.rating === 'number' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F8FC] px-2 py-0.5 text-[10px] font-semibold text-gray-700">
              <i className="ri-star-fill text-[#F5B13A]" /> {item.rating.toFixed(1)}
              {item.reviewCount ? (
                <span className="text-gray-400">({item.reviewCount})</span>
              ) : null}
            </span>
          )}
          <span
            className={`text-[10px] font-black uppercase tracking-widest ${
              item.inStock ? 'text-emerald-600' : 'text-gray-400'
            }`}
          >
            {item.inStock ? 'In Stock' : 'Unavailable'}
          </span>
        </div>

        <Link
          href={`/product/${item.slug}`}
          className="mt-2 line-clamp-2 font-serif text-base font-bold text-primary transition-colors hover:text-[#1ABCDF]"
        >
          {item.name}
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-serif text-lg font-bold text-primary">
            {formatPrice(item.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(item.originalPrice!)}
            </span>
          )}
        </div>

        {!item.inStock && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="mt-3 inline-flex w-fit items-center gap-1 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-[#CC1414]"
          >
            Remove <i className="ri-close-line" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function WishlistCardList({
  item,
  onMove,
  onRemove,
  formatPrice,
}: {
  item: WishlistItem;
  onMove: (i: WishlistItem) => void;
  onRemove: (id: string) => void;
  formatPrice: (n: number) => string;
}) {
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const discountPct = hasDiscount
    ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="group flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-primary/20 hover:shadow-[0_20px_40px_-25px_rgba(13,27,69,0.25)] sm:gap-5 sm:p-5"
                >
                  <Link
                    href={`/product/${item.slug}`}
        className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-[#F7F8FC] sm:h-32 sm:w-28"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="112px"
          className={`object-cover object-top transition-transform duration-700 group-hover:scale-105 ${
            !item.inStock ? 'grayscale' : ''
          }`}
                    />
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-full bg-[#CC1414] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
            −{discountPct}%
          </span>
        )}
                  </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                item.inStock ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              {item.inStock ? 'In Stock' : 'Unavailable'}
            </span>
            {typeof item.rating === 'number' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                <i className="ri-star-fill text-[#F5B13A]" /> {item.rating.toFixed(1)}
              </span>
            )}
          </div>
                      <Link
                        href={`/product/${item.slug}`}
            className="mt-1 line-clamp-2 font-serif text-base font-bold text-primary transition-colors hover:text-[#1ABCDF] sm:text-lg"
                      >
                        {item.name}
                      </Link>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-serif text-lg font-bold text-primary">
              {formatPrice(item.price)}
                        </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(item.originalPrice!)}
                          </span>
                        )}
                      </div>
                    </div>

        <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
            onClick={() => onMove(item)}
                        disabled={!item.inStock}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#1ABCDF] disabled:cursor-not-allowed disabled:opacity-50"
                      >
            <i className="ri-shopping-bag-3-line" /> Move to Cart
                      </button>
          <Link
            href={`/product/${item.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-700 transition-colors hover:border-primary hover:text-primary"
          >
            View <i className="ri-arrow-right-up-line" />
          </Link>
                      <button
                        type="button"
            onClick={() => onRemove(item.id)}
            aria-label="Remove from wishlist"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#CC1414] hover:bg-[#CC1414] hover:text-white"
                      >
            <i className="ri-delete-bin-6-line" />
                      </button>
                    </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  const suggestions = [
    { label: 'Shop All', href: '/shop', icon: 'ri-store-2-line' },
    { label: 'Collections', href: '/categories', icon: 'ri-gallery-line' },
    { label: 'Flash Sale', href: '/shop?sale=true', icon: 'ri-flashlight-line' },
  ];
  const perks = [
    { icon: 'ri-heart-add-line', title: 'Save for Later', text: 'Build a private edit of the pieces you love.' },
    { icon: 'ri-notification-3-line', title: 'Get Restock Alerts', text: 'We’ll ping you when sold-out items return.' },
    { icon: 'ri-share-forward-line', title: 'Share Your List', text: 'Send your curation to friends & family.' },
  ];

  return (
    <section className="py-12 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 md:p-12 shadow-[0_20px_50px_-30px_rgba(13,27,69,0.2)]">
            <span className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#CC1414]/10 blur-3xl" />
            <span className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#1ABCDF]/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-[#F7F8FC]">
                <i className="ri-heart-3-line text-5xl text-[#CC1414]" />
                <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs shadow-md">
                  <i className="ri-add-line" />
                </span>
              </div>

              <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">
                No items saved… yet.
              </h2>
              <p className="mt-3 max-w-xl text-gray-500">
                Tap the heart on any product you love to save it here. Your wishlist stays safe on this
                device, ready for the perfect moment.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {suggestions.map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-700 transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                  >
                    <i className={`${s.icon} text-base`} /> {s.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-10 grid gap-4 md:grid-cols-3">
              {perks.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-gray-100 bg-[#F7F8FC] p-5 transition-colors hover:border-primary/20"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary">
                    <i className={`${p.icon} text-xl`} />
                  </div>
                  <p className="font-serif text-base font-bold text-primary">{p.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

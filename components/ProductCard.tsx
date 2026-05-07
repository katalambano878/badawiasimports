'use client';

import { useState } from 'react';
import Link from 'next/link';
import LazyImage from './LazyImage';
import { useCart } from '@/context/CartContext';
import { useCMS } from '@/context/CMSContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice as formatCurrency } from '@/lib/formatCurrency';

// Map common color names to hex values for swatches
const COLOR_MAP: Record<string, string> = {
  black: '#000000', white: '#FFFFFF', red: '#EF4444', blue: '#3B82F6',
  navy: '#1E3A5F', green: '#22C55E', yellow: '#EAB308', orange: '#F97316',
  pink: '#EC4899', purple: '#A855F7', brown: '#92400E', beige: '#D4C5A9',
  grey: '#6B7280', gray: '#6B7280', cream: '#FFFDD0', teal: '#14B8A6',
  maroon: '#800000', coral: '#FF7F50', burgundy: '#800020', olive: '#808000',
  tan: '#D2B48C', khaki: '#C3B091', charcoal: '#36454F', ivory: '#FFFFF0',
  gold: '#FFD700', silver: '#C0C0C0', rose: '#FF007F', lavender: '#E6E6FA',
  mint: '#98FB98', peach: '#FFDAB9', wine: '#722F37', denim: '#1560BD',
  nude: '#E3BC9A', camel: '#C19A6B', sage: '#BCB88A', rust: '#B7410E',
  mustard: '#FFDB58', plum: '#8E4585', lilac: '#C8A2C8', stone: '#928E85',
  sand: '#C2B280', taupe: '#483C32', mauve: '#E0B0FF', sky: '#87CEEB',
  forest: '#228B22', cobalt: '#0047AB', emerald: '#50C878', scarlet: '#FF2400',
  aqua: '#00FFFF', turquoise: '#40E0D0', indigo: '#4B0082', crimson: '#DC143C',
  magenta: '#FF00FF', cyan: '#00FFFF', chocolate: '#7B3F00', coffee: '#6F4E37',
};

export function getColorHex(colorName: string): string | null {
  const lower = colorName.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export interface ColorVariant {
  name: string;
  hex: string;
}

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  salePrice?: number | null;
  isSaleActive?: boolean;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
  maxStock?: number;
  moq?: number;
  hasVariants?: boolean;
  minVariantPrice?: number;
  colorVariants?: ColorVariant[];
  brand?: string;
}

export default function ProductCard({
  id,
  slug,
  name,
  price,
  originalPrice,
  salePrice,
  isSaleActive = false,
  image,
  rating = 5,
  reviewCount = 0,
  badge,
  inStock = true,
  maxStock = 50,
  moq = 1,
  hasVariants = false,
  minVariantPrice,
  colorVariants = [],
  brand,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { getSetting } = useCMS();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const currencySymbol = getSetting('currency_symbol') || '$';
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const showSalePrice = isSaleActive && salePrice != null && salePrice > 0 && salePrice < price;
  const basePrice = hasVariants && minVariantPrice ? minVariantPrice : price;
  const displayPrice = showSalePrice ? salePrice : basePrice;
  const strikePrice = showSalePrice ? price : originalPrice;
  const discount = strikePrice && strikePrice > displayPrice
    ? Math.round((1 - displayPrice / strikePrice) * 100)
    : 0;
  const saleBadge = showSalePrice ? 'Sale' : badge;
  const MAX_SWATCHES = 5;
  const inWishlist = isInWishlist(id);

  const formatPrice = (val: number) => formatCurrency(val, currencySymbol);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(id);
    } else {
      addToWishlist({
        id, name, price: displayPrice, originalPrice, image, rating, reviewCount, badge, inStock, slug,
      });
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addToCart({ id, name, price: displayPrice, image, quantity: moq, slug, maxStock, moq });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="group relative flex h-full flex-col">
      {/* Image wrapper */}
      <Link
        href={`/product/${slug}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-[#F7F8FC]"
      >
        <LazyImage
          src={image}
          alt={name}
          className={`h-full w-full object-cover object-center transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            inStock ? 'group-hover:scale-[1.06]' : 'grayscale-[40%]'
          }`}
        />

        {/* Gradient scrim on hover for action button readability */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Badges (top-left stack) */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
        {saleBadge && (
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm backdrop-blur ${showSalePrice ? 'bg-red-500 text-white' : 'bg-white/95 text-primary'}`}>
            {saleBadge}
          </span>
        )}
        {discount > 0 && (
            <span className="rounded-full bg-[#CC1414] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
            -{discount}%
          </span>
        )}
        {!inStock && (
            <span className="rounded-full bg-gray-900/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
              Sold out
            </span>
          )}
        </div>

        {/* Wishlist button (top-right) */}
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-all duration-300 ${
            inWishlist
              ? 'bg-[#CC1414] text-white shadow-[0_8px_20px_-8px_rgba(204,20,20,0.6)]'
              : 'bg-white/90 text-primary hover:bg-white hover:scale-110'
          }`}
        >
          <i className={`${inWishlist ? 'ri-heart-fill' : 'ri-heart-line'} text-base`} />
        </button>

        {/* Slide-up action bar */}
        {inStock && (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 md:block">
            {hasVariants ? (
              <Link
                href={`/product/${slug}`}
                onClick={(e) => e.stopPropagation()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/95 px-4 py-3 text-xs font-black uppercase tracking-widest text-primary shadow-[0_10px_30px_-10px_rgba(13,27,69,0.4)] backdrop-blur transition-colors hover:bg-primary hover:text-white"
              >
                Select Options <i className="ri-arrow-right-line text-base" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(13,27,69,0.4)] backdrop-blur transition-all ${
                  added
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/95 text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {added ? (
                  <>
                    Added <i className="ri-check-line text-base" />
                  </>
                ) : (
                  <>
                    Add to Cart <i className="ri-shopping-bag-line text-base" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-grow flex-col pt-4 text-left">
        {brand && (
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            {brand}
          </p>
        )}

        <Link href={`/product/${slug}`}>
          <h3 className="font-serif text-[1.02rem] leading-snug text-primary line-clamp-2 transition-colors group-hover:text-[#1ABCDF]">
            {name}
          </h3>
        </Link>

        {(rating || reviewCount) > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <i
                  key={s}
                  className={`${
                    s <= Math.round(rating)
                      ? 'ri-star-fill text-amber-400'
                      : 'ri-star-line text-gray-300'
                  } text-xs`}
                />
              ))}
            </div>
            {reviewCount > 0 && (
              <span className="text-[11px] text-gray-400">({reviewCount})</span>
            )}
          </div>
        )}

        {colorVariants.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {colorVariants.slice(0, MAX_SWATCHES).map((color) => (
              <button
                key={color.name}
                title={color.name}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveColor(activeColor === color.name ? null : color.name);
                }}
                className={`h-4 w-4 flex-shrink-0 rounded-full border transition-all duration-200 ${
                  activeColor === color.name
                    ? 'ring-2 ring-offset-1 ring-primary'
                    : 'hover:scale-110'
                } ${color.hex === '#FFFFFF' ? 'border-gray-300' : 'border-transparent'}`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {colorVariants.length > MAX_SWATCHES && (
              <span className="ml-0.5 text-[11px] text-gray-400">
                +{colorVariants.length - MAX_SWATCHES}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          {hasVariants && minVariantPrice != null && !showSalePrice ? (
            <span className="font-serif text-xl font-bold text-primary">
              From {formatPrice(minVariantPrice)}
            </span>
          ) : (
            <span className={`font-serif text-xl font-bold ${showSalePrice ? 'text-red-600' : 'text-primary'}`}>
              {formatPrice(displayPrice)}
            </span>
          )}
          {strikePrice != null && strikePrice > displayPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(strikePrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

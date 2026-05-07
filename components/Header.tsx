'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import MiniCart from './MiniCart';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { useCMS } from '@/context/CMSContext';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';

/** Mobile menu: link or expandable parent with sub-items (2 levels under Shop) */
type MobileNavLink = { label: string; href: string };
type ShopSectionItem =
  | MobileNavLink
  | { label: string; children: MobileNavLink[] };
type MobileNavItem =
  | MobileNavLink
  | { label: string; children: ShopSectionItem[] };

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

function isNavItemWithChildren(item: MobileNavItem): item is { label: string; children: ShopSectionItem[] } {
  return 'children' in item && Array.isArray((item as { children?: unknown }).children);
}
function isShopSectionWithSubs(item: ShopSectionItem): item is { label: string; children: MobileNavLink[] } {
  return 'children' in item && Array.isArray((item as { children?: unknown }).children);
}

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  
  // God Mode Scroll State
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 60);
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileNavItems = MOBILE_NAV_ITEMS;

  const { cartCount, isCartOpen, setIsCartOpen } = useCart();
  const { getSetting, getSettingJSON } = useCMS();

  const siteName = getSetting('site_name') || process.env.NEXT_PUBLIC_SITE_NAME || "BADAWIA'S IMPORTS";
  const siteLogo = '/logo.png';
  const headerLogoHeight = Number.parseInt(getSetting('header_logo_height') || '32', 10);
  const logoHeight = Number.isFinite(headerLogoHeight) ? Math.min(56, Math.max(24, headerLogoHeight)) : 32;
  const showSearch = getSetting('header_show_search') !== 'false';
  const showWishlist = getSetting('header_show_wishlist') !== 'false';
  const showCart = getSetting('header_show_cart') !== 'false';
  const showAccount = getSetting('header_show_account') !== 'false';
  const navLinks = getSettingJSON<{ label: string; href: string }[]>('header_nav_links_json', [
    { label: 'Shop', href: '/shop' },
    { label: 'Categories', href: '/categories' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ]);

  useEffect(() => {
    const updateWishlistCount = () => {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlistCount(wishlist.length);
    };
    updateWishlistCount();
    window.addEventListener('wishlistUpdated', updateWishlistCount);

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      window.removeEventListener('wishlistUpdated', updateWishlistCount);
      subscription.unsubscribe();
    };
  }, []);

  const fetchSearchResults = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('id, slug, name, price, categories!inner(name), product_images!product_id(url, position)')
        .ilike('name', `%${trimmed}%`)
        .order('position', { foreignTable: 'product_images', ascending: true })
        .limit(8);

      const mapped: SearchResult[] = (data || []).map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        image: p.product_images?.[0]?.url || '/placeholder.png',
        category: p.categories?.name || '',
      }));
      setSearchResults(mapped);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(() => fetchSearchResults(value), 250);
  }, [fetchSearchResults]);

  useEffect(() => {
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const isSaleActive = getSetting('store_wide_sale_enabled') === 'true';
  const saleBannerText = getSetting('sale_banner_text') || 'STORE-WIDE SALE — Up to 50% OFF Everything!';

  return (
    <>
      {/* ── Sale Banner ─────────────────────────────────────────────────── */}
      {isSaleActive && (
        <div className="bg-red-600 text-white text-center py-2 px-4 text-sm font-semibold tracking-wide relative z-[60]">
          <div className="flex items-center justify-center gap-2">
            <i className="ri-fire-fill text-yellow-300 animate-pulse"></i>
            <span>{saleBannerText}</span>
            <i className="ri-fire-fill text-yellow-300 animate-pulse"></i>
          </div>
        </div>
      )}

      {/* ── God-Mode Sticky Header ───────────────────────────────────────── */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`sticky top-0 z-50 w-full transition-all duration-500 ease-out backdrop-blur-2xl border-b ${
          isScrolled 
            ? 'py-2 bg-white/95 border-gray-200 shadow-sm' 
            : 'py-4 bg-white/80 border-transparent shadow-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 text-primary hover:text-[#1ABCDF] transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <i className="ri-menu-4-line text-2xl" aria-hidden />
            </button>
            <Link href="/" className="flex items-center shrink-0 transition-transform hover:scale-105" aria-label={siteName + ' home'}>
              {!logoError ? (
                <img
                  src={siteLogo}
                  alt=""
                  className="w-auto object-contain drop-shadow-sm"
                  style={{ height: `${isScrolled ? logoHeight * 0.85 : logoHeight}px`, transition: 'height 0.3s ease' }}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-xl font-serif font-bold text-primary tracking-tight">{siteName}</span>
              )}
            </Link>
          </div>

          {/* Center: God-Mode Nav Links */}
          <nav className="hidden lg:flex items-center justify-center gap-10" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative text-sm font-black uppercase tracking-widest text-primary/80 hover:text-primary transition-colors py-2"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[#CC1414] transition-all duration-300 ease-out group-hover:w-full group-hover:left-0" />
              </Link>
            ))}
          </nav>

          {/* Right: Modern Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {showSearch && (
              <button
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-[#1ABCDF]/10 hover:text-[#1ABCDF] transition-all"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search"
              >
                <i className="ri-search-line text-xl font-medium" aria-hidden />
              </button>
            )}
            {showWishlist && (
              <Link
                href="/wishlist"
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-[#1ABCDF]/10 hover:text-[#1ABCDF] transition-all"
                aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist'}
              >
                <i className="ri-heart-3-line text-xl font-medium" aria-hidden />
                <AnimatePresence>
                  {wishlistCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-[#CC1414] text-white text-[10px] font-black tracking-tighter rounded-full flex items-center justify-center shadow-lg"
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}
            {showAccount && (
              <Link
                href={user ? "/account" : "/auth/login"}
                className="w-10 h-10 rounded-full hidden sm:flex items-center justify-center text-primary hover:bg-[#1ABCDF]/10 hover:text-[#1ABCDF] transition-all"
                aria-label={user ? "Account" : "Log in"}
              >
                <i className="ri-user-smile-line text-xl font-medium" aria-hidden />
              </Link>
            )}
            {showCart && (
              <div className="relative">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-primary hover:bg-[#1ABCDF] hover:shadow-[0_0_15px_rgba(26,188,223,0.5)] transition-all duration-300 relative"
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
                  aria-expanded={isCartOpen}
                  aria-controls="mini-cart"
                >
                  <i className="ri-shopping-cart-2-line text-lg font-medium" aria-hidden />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-[#CC1414] border-2 border-white text-white text-[10px] font-black tracking-tighter rounded-full flex items-center justify-center shadow-md"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* ── God-Mode Search Overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl" 
            role="dialog" aria-modal="true" aria-label="Search"
          >
            <div className="w-full h-full flex flex-col items-center justify-start pt-20 px-4">
              <motion.button
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                type="button"
                className="absolute top-8 right-8 p-3 bg-gray-100 rounded-full text-gray-500 hover:bg-primary hover:text-white transition-all"
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                aria-label="Close search"
              >
                <i className="ri-close-line text-2xl" aria-hidden />
              </motion.button>

              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="w-full max-w-3xl"
              >
                <form onSubmit={handleSearch} className="relative flex items-center border-b-2 border-primary/20 focus-within:border-primary pb-4 transition-colors">
                  <i className="ri-search-line text-3xl text-primary mr-4" aria-hidden />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder="Discover Premium Imports..."
                    className="w-full text-3xl md:text-5xl font-serif font-bold text-primary focus:outline-none placeholder:text-gray-300 bg-transparent"
                    autoFocus
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="p-2 text-gray-300 hover:text-[#CC1414] transition-colors"
                      onClick={() => { handleSearchInput(''); searchInputRef.current?.focus(); }}
                      aria-label="Clear search"
                    >
                      <i className="ri-close-circle-fill text-2xl" aria-hidden />
                    </button>
                  )}
                </form>

                {/* Live results */}
                <div className="mt-8 max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
                  {searchLoading && searchQuery.trim() && (
                    <div className="flex flex-col items-center justify-center py-12 text-primary">
                      <i className="ri-loader-4-line animate-spin text-4xl mb-4 text-[#1ABCDF]" aria-hidden />
                      <span className="text-sm font-black uppercase tracking-widest text-gray-400">Curating Results...</span>
                    </div>
                  )}

                  {!searchLoading && searchQuery.trim() && searchResults.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">
                        {searchResults.length} Match{searchResults.length !== 1 ? 'es' : ''} Found
                      </p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchResults.map((product, i) => (
                          <motion.li 
                            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                            key={product.id}
                          >
                            <Link
                              href={`/product/${product.slug}`}
                              className="group flex items-center gap-4 p-3 bg-white border border-gray-100 hover:border-[#1ABCDF]/30 rounded-2xl hover:shadow-xl hover:shadow-[#1ABCDF]/5 transition-all"
                              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                            >
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                                <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-primary truncate group-hover:text-[#1ABCDF] transition-colors">{product.name}</p>
                                {product.category && <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{product.category}</p>}
                              </div>
                              <span className="text-sm font-black text-primary shrink-0 bg-primary/5 px-3 py-1.5 rounded-lg">
                                GH₵{product.price.toLocaleString()}
                              </span>
                            </Link>
                          </motion.li>
                        ))}
                      </ul>
                      <Link
                        href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                        className="inline-block mt-8 text-sm font-black uppercase tracking-widest text-[#1ABCDF] hover:text-primary transition-colors group"
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                      >
                        View All Results <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform inline-block" />
                      </Link>
                    </motion.div>
                  )}

                  {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                      <i className="ri-search-line text-6xl text-gray-200 block mb-4" aria-hidden />
                      <p className="text-primary font-serif font-bold text-2xl">No artifacts found</p>
                      <p className="text-sm text-gray-400 mt-2 font-light">Refine your query to explore our collection.</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#060E28]/60 backdrop-blur-md"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-0 left-0 bottom-0 w-full max-w-[320px] bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100 bg-[#FDFDFD]">
                <img src={siteLogo} alt={siteName} loading="eager" decoding="async" className="h-8 object-contain" />
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); setExpandedMobileSection(null); }}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-primary hover:bg-[#CC1414] hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <i className="ri-close-line text-xl" aria-hidden />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-6 px-4" aria-label="Mobile navigation">
                <Link
                  href="/"
                  className="block px-4 py-3 text-lg font-black uppercase tracking-widest text-primary hover:text-[#1ABCDF] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                {mobileNavItems.map((item) => {
                  if (isNavItemWithChildren(item)) {
                    const isExpanded = expandedMobileSection === item.label;
                    return (
                      <div key={item.label} className="mb-2">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-4 py-3 text-lg font-black uppercase tracking-widest text-primary hover:text-[#1ABCDF] transition-colors"
                          onClick={() => setExpandedMobileSection(isExpanded ? null : item.label)}
                          aria-expanded={isExpanded}
                        >
                          {item.label}
                          <i className={`ri-arrow-down-s-line text-2xl transition-transform ${isExpanded ? 'rotate-180 text-[#1ABCDF]' : 'text-gray-300'}`} aria-hidden />
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-4 pb-2 border-l-2 border-gray-100 ml-6">
                                {item.children.map((sub) => {
                                  if (isShopSectionWithSubs(sub)) {
                                    const subExpanded = expandedMobileSection === `${item.label}-${sub.label}`;
                                    return (
                                      <div key={sub.label} className="mt-2">
                                        <button
                                          type="button"
                                          className="flex w-full items-center justify-between py-2 text-sm font-bold uppercase tracking-wider text-gray-500"
                                          onClick={() => setExpandedMobileSection(subExpanded ? null : `${item.label}-${sub.label}`)}
                                        >
                                          {sub.label}
                                          <i className={`ri-add-line text-lg transition-transform ${subExpanded ? 'rotate-45 text-primary' : ''}`} aria-hidden />
                                        </button>
                                        {subExpanded && (
                                          <div className="pl-4 mt-1 space-y-3 py-2">
                                            {sub.children.map((leaf) => (
                                              <Link
                                                key={leaf.href + leaf.label}
                                                href={leaf.href}
                                                className="block text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                              >
                                                {leaf.label}
                                              </Link>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      className="block py-2 text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-primary transition-colors"
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      {sub.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-3 text-lg font-black uppercase tracking-widest text-primary hover:text-[#1ABCDF] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                
                <div className="mt-8 px-4">
                  <Link 
                    href={user ? '/account' : '/auth/login'} 
                    className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-[#1ABCDF] transition-colors rounded-xl shadow-lg" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className="ri-user-smile-fill text-lg" />
                    {user ? 'My Account' : 'Sign In'}
                  </Link>
                </div>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

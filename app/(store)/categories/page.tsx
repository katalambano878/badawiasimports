import Link from 'next/link';
import { dbAdmin } from '@/lib/db/admin';
import { HERO_IMAGES_OTHER_PAGES } from '@/lib/hero-images';
import ScrollReveal from '@/components/ScrollReveal';

export const revalidate = 0;

export default async function CategoriesPage() {
  const { data: categoriesData } = await dbAdmin
    .from('categories')
    .select(`
      id,
      name,
      slug,
      description,
      image_url,
      position,
      parent_id
    `)
    .eq('status', 'active')
    .order('position', { ascending: true });

  const categories = (categoriesData || []).map((c: any) => ({
    ...c,
    image:
      c.image_url ||
      'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=2626&auto=format&fit=crop',
  }));

  // Split into featured (first) + the rest
  const featured = categories[0];
  const rest = categories.slice(1);

  // Build a compact shelf rail list of all categories (top-level preferred)
  const shelf = categories.filter((c: any) => !c.parent_id);

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      {/* ── Editorial Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#060E28] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={HERO_IMAGES_OTHER_PAGES[1]}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top_right,_#1ABCDF_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-16 bg-[radial-gradient(ellipse_at_bottom_left,_#1ABCDF_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="absolute -top-40 -left-20 h-[420px] w-[420px] rounded-full bg-[#1ABCDF]/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-20 h-[420px] w-[420px] rounded-full bg-[#CC1414]/10 blur-3xl animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-24 md:pb-20">
          <nav className="mb-5 md:mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/50">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <i className="ri-arrow-right-s-line" />
            <span className="text-[#1ABCDF]">Collections</span>
          </nav>

          <div className="grid items-end gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="mb-3 md:mb-5 flex items-center gap-3">
                <span className="h-px w-12 bg-[#1ABCDF]" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1ABCDF]">
                  Explore The Shelves
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                Curated <br className="hidden md:block" />
                <span className="italic font-light bg-gradient-to-r from-white to-[#1ABCDF] bg-clip-text text-transparent">
                  Collections.
                </span>
              </h1>
              <p className="mt-3 md:mt-5 max-w-xl text-sm sm:text-base font-light text-white/60 md:text-lg">
                Browse every aisle of our import universe — from daily essentials to premium lifestyle, each collection is hand-picked for the Ghanaian market.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Collections</div>
                  <div className="font-serif text-2xl font-bold text-white">{categories.length}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Service</div>
                  <div className="font-serif text-2xl font-bold text-white">24/7</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-primary transition-all duration-500 hover:-translate-y-0.5 hover:bg-[#1ABCDF] hover:text-white"
                >
                  Shop Everything
                  <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/[0.04] px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:border-white/60 hover:bg-white/10"
                >
                  <i className="ri-customer-service-2-line" /> Concierge
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shelf Rail (sticky) ───────────────────────────────── */}
      {shelf.length > 0 && (
        <div className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <span className="hidden sm:block whitespace-nowrap text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                Jump to
              </span>
              <div className="no-scrollbar flex-1 overflow-x-auto">
                <div className="flex w-max items-center gap-2">
                  <Link
                    href="/shop"
                    className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-700 transition-all hover:border-primary hover:text-primary"
                  >
                    All
                  </Link>
                  {shelf.map((c: any) => (
                    <a
                      key={c.id}
                      href={`#cat-${c.slug}`}
                      className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-700 transition-all hover:border-primary hover:text-primary"
                    >
                      {c.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Featured Collection (split hero) ───────────────────── */}
      {featured && (
        <section className="hidden md:block py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="up">
              <Link
                href={`/shop?category=${featured.slug}`}
                id={`cat-${featured.slug}`}
                className="group relative grid overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-[#060E28] via-[#0A1438] to-[#1ABCDF]/30 shadow-[0_30px_60px_-30px_rgba(13,27,69,0.35)] lg:grid-cols-[1.05fr_1fr]"
              >
                <div className="relative z-10 p-8 md:p-12 lg:p-16 text-white">
                  <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1ABCDF]" />
                    Featured Collection
                  </span>
                  <h2 className="font-serif text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                    {featured.name}
                  </h2>
                  <p className="mt-4 max-w-xl text-base font-light text-white/70 md:text-lg">
                    {featured.description ||
                      'A thoughtfully selected lineup bridging global craft with everyday Ghana. Explore the highlights.'}
                  </p>
                  <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-primary transition-colors group-hover:bg-[#1ABCDF] group-hover:text-white">
                    Explore Collection
                    <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
                <div className="relative h-72 lg:h-auto">
                  <img
                    src={featured.image}
                    alt={featured.name}
                    className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#060E28]/70 lg:bg-gradient-to-r" />
                </div>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── Editorial Masonry Grid ─────────────────────────────── */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-8 bg-[#CC1414]" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#CC1414]">
                  All Collections
                </span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">
                Explore Every Shelf
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden md:inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"
            >
              View All
              <span className="h-px w-10 bg-primary transition-all duration-300 group-hover:w-16" />
            </Link>
          </div>

          {rest.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {rest.map((category: any) => (
                <Link
                  key={category.id}
                  id={`cat-${category.slug}`}
                  href={`/shop?category=${category.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-gray-100 bg-[#060E28] shadow-[0_10px_24px_-18px_rgba(13,27,69,0.35)] transition-all duration-500 hover:shadow-[0_18px_32px_-16px_rgba(13,27,69,0.45)]"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060E28]/95 via-[#060E28]/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />

                  <span className="absolute left-3 top-3 h-1 w-6 rounded-full bg-[#1ABCDF] transition-all duration-500 group-hover:w-10" />

                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-serif text-sm sm:text-base font-bold leading-tight line-clamp-2">
                          {category.name}
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
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-24 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F7F8FC]">
                <i className="ri-store-2-line text-4xl text-gray-300" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-primary">No collections yet</h3>
              <p className="mt-2 text-gray-500">New arrivals coming soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Concierge Card (compact, rounded — no footer conflict) ─ */}
      <section className="bg-[#F7F8FC] py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#060E28] via-[#0A1438] to-[#143D70] p-8 md:p-10 text-white">
              <div className="absolute inset-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
              <div className="absolute -top-28 -right-16 h-[300px] w-[300px] rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/90 backdrop-blur">
                    <i className="ri-sparkling-2-line text-[#1ABCDF]" />
                    Personal Concierge
                  </span>
                  <h2 className="mt-4 font-serif text-3xl md:text-4xl font-bold leading-tight">
                    Didn't find what you're looking for?
                  </h2>
                  <p className="mt-3 max-w-lg text-base font-light text-white/70">
                    Our stylists source custom imports on request. Chat with us for bulk quotes, personalized picks, and logistics support.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <Link
                    href="/shop"
                    className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-4 text-xs font-black uppercase tracking-widest text-primary transition-colors hover:bg-[#1ABCDF] hover:text-white md:w-auto"
                  >
                    <i className="ri-search-line text-base" />
                    Browse All Products
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/25 bg-white/[0.04] px-6 py-4 text-xs font-black uppercase tracking-widest text-white transition-colors hover:border-white/60 hover:bg-white/10 md:w-auto"
                  >
                    <i className="ri-customer-service-2-line text-base" />
                    Contact Concierge
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

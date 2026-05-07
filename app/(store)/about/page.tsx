'use client';

import Link from 'next/link';
import { useCMS } from '@/context/CMSContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { HERO_IMAGES_OTHER_PAGES } from '@/lib/hero-images';
import ScrollReveal from '@/components/ScrollReveal';

export default function AboutPage() {
  usePageTitle('Our Story');
  const { getSetting } = useCMS();

  const siteName =
    getSetting('site_name') || process.env.NEXT_PUBLIC_SITE_NAME || "BADAWIA'S IMPORTS";

  // CMS-driven fields (backwards-compatible)
  const heroTitle = getSetting('about_hero_title') || 'Our Story';
  const heroSubtitle =
    getSetting('about_hero_subtitle') ||
    'A journey of passion, precision, and purposeful imports — bridging global quality with everyday Ghana.';
  const mission1Title = getSetting('about_mission1_title') || 'Direct Sourcing';
  const mission1Content =
    getSetting('about_mission1_content') ||
    'We travel to every source — partnering directly with manufacturers. No middlemen, no inflated prices, just the clearest line between craft and customer.';
  const mission2Title = getSetting('about_mission2_title') || 'Quality For Everyone';
  const mission2Content =
    getSetting('about_mission2_content') ||
    'Premium shouldn’t be exclusive. We democratize quality — curating imports everyone can access, at prices that make sense.';
  const valuesTitle = getSetting('about_values_title') || 'Why Shop With Us';
  const valuesSubtitle =
    getSetting('about_values_subtitle') || 'Four promises that guide every import we make.';
  const founderName = getSetting('about_founder_name') || 'CEO / Founder';
  const founderTitle = getSetting('about_founder_title') || 'Founder';
  const storyImage = '/ceo-portrait.png';

  const stats = [
    { label: 'Founded', value: getSetting('about_stat_founded') || '2020' },
    { label: 'Hubs', value: getSetting('about_stat_hubs') || 'Tamale · Accra' },
    { label: 'Products', value: getSetting('about_stat_products') || '2,000+' },
    { label: 'Happy Clients', value: getSetting('about_stat_clients') || '5k+' },
  ];

  const values = [
    {
      icon: 'ri-verified-badge-line',
      title: 'Authenticity',
      description:
        'Handpicked with care. We document the sourcing journey so you know exactly what you are buying.',
    },
    {
      icon: 'ri-money-dollar-circle-line',
      title: 'Unbeatable Value',
      description:
        'Direct from the factory to you. We cut out the middleman to offer premium quality at wholesale prices.',
    },
    {
      icon: 'ri-star-smile-line',
      title: 'Quality Assured',
      description:
        "Every product is inspected personally. If it doesn't meet our standards, it doesn't make it to the store.",
    },
    {
      icon: 'ri-group-line',
      title: 'Community First',
      description:
        'Built on trust and connection. We listen to our customers and find the products you actually want.',
    },
  ];

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      {/* ── Editorial Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#060E28] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={HERO_IMAGES_OTHER_PAGES[2]}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top_left,_#1ABCDF_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_right,_#CC1414_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="absolute -top-40 -left-20 h-[420px] w-[420px] rounded-full bg-[#1ABCDF]/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full bg-[#CC1414]/10 blur-3xl animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-14 md:pt-24 md:pb-20">
          <nav className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/50">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <i className="ri-arrow-right-s-line" />
            <span className="text-[#1ABCDF]">About</span>
          </nav>

          <div className="grid items-end gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-12 bg-[#1ABCDF]" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1ABCDF]">
                  The House of Imports
                </span>
              </div>
              <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                {heroTitle.split(' ').slice(0, -1).join(' ') || 'Our'} <br className="hidden md:block" />
                <span className="italic font-light bg-gradient-to-r from-white to-[#1ABCDF] bg-clip-text text-transparent">
                  {heroTitle.split(' ').slice(-1).join(' ') || 'Story.'}
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base font-light text-white/60 md:text-lg">{heroSubtitle}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-primary transition-all duration-500 hover:-translate-y-0.5 hover:bg-[#1ABCDF] hover:text-white"
                >
                  Explore Products
                  <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/[0.04] px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:border-white/60 hover:bg-white/10"
                >
                  <i className="ri-customer-service-2-line" /> Talk to Us
                </Link>
        </div>
      </div>

            <div className="grid grid-cols-2 gap-3">
              {stats.map(s => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur"
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
                    {s.label}
                  </div>
                  <div className="mt-1 font-serif text-2xl font-bold text-white">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Founder Image Placeholder ───────────────────────────── */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="grid gap-6 md:grid-cols-[360px_1fr] md:items-stretch">
              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
                {storyImage ? (
                  <img
                    src={storyImage}
                    alt={`${founderName} portrait`}
                    className="aspect-[3/4] md:aspect-auto md:h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/logo.svg';
                    }}
                  />
                ) : (
                  <div className="flex aspect-[3/4] md:aspect-auto md:h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#F7F8FC] via-white to-[#EDF6FA] text-primary">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#1ABCDF]/30 bg-white shadow-sm">
                      <i className="ri-user-star-line text-3xl text-[#1ABCDF]" />
                    </div>
                    <span className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                      CEO Portrait
                    </span>
                    <span className="mt-1 text-[10px] uppercase tracking-[0.25em] text-gray-400">
                      3:4 Image · Update via CMS
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center rounded-3xl border border-gray-100 bg-white p-6 md:p-10">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#1ABCDF]">
                  Leadership
                </p>
                <h2 className="mt-2 font-serif text-2xl font-bold text-primary md:text-4xl">{founderName}</h2>
                <p className="mt-1 text-sm font-medium text-gray-500">{founderTitle}</p>

                <div className="mt-5 space-y-4 text-sm font-light leading-relaxed text-gray-600 md:text-base">
                  <p>
                    A relentless builder with deep roots in West African trade, {founderName} founded Badawia&apos;s Imports
                    on a single principle: the global market should be accessible to every Ghanaian, without
                    compromise on quality, speed, or trust.
                  </p>
                  <p>
                    Over the years, {founderName.split(' ')[0] || 'our founder'} has built direct partnerships with premium
                    manufacturers across China and beyond, engineering an end-to-end logistics network that
                    delivers from source to doorstep. From flagship showrooms in Tamale and Accra to a tightly
                    curated catalogue, every decision is anchored in one belief — Ghana deserves better.
                  </p>
                  <p className="italic text-gray-500 border-l-2 border-[#1ABCDF] pl-4">
                    &ldquo;We don&apos;t just import products — we import peace of mind, opportunity, and the
                    confidence that what arrives at your door is exactly what was promised.&rdquo;
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-5">
                  <span className="rounded-full bg-[#F7F8FC] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Founder &amp; CEO
                  </span>
                  <span className="rounded-full bg-[#F7F8FC] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Strategist
                  </span>
                  <span className="rounded-full bg-[#F7F8FC] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Trade Visionary
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Brand Pillars (Mission split) ──────────────────────── */}
      <section className="py-8 md:py-10 bg-[#F7F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 md:mb-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-[#1ABCDF]" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1ABCDF]">
                Brand Pillars
              </span>
              <span className="h-px w-10 bg-[#1ABCDF]" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-primary md:text-4xl">
              What Drives Us Forward
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            {/* Light Card */}
            <ScrollReveal direction="up">
              <div className="group relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 md:p-7 shadow-[0_15px_40px_-25px_rgba(13,27,69,0.2)] transition-all duration-500 hover:shadow-[0_25px_60px_-25px_rgba(13,27,69,0.3)]">
                <span className="absolute left-0 top-0 h-1 w-16 bg-[#1ABCDF] transition-all duration-500 group-hover:w-32" />
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-colors duration-500 group-hover:bg-primary group-hover:text-white">
                  <i className="ri-plane-line text-2xl" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Pillar 01
                </span>
                <h3 className="mt-2 font-serif text-xl font-bold text-primary md:text-2xl">
                  {mission1Title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-gray-600 md:text-base">
                  {mission1Content}
                </p>
              </div>
            </ScrollReveal>

            {/* Dark Card */}
            <ScrollReveal direction="up">
              <div className="group relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#060E28] via-[#0A1438] to-[#1ABCDF]/30 p-6 md:p-7 text-white shadow-[0_20px_60px_-30px_rgba(13,27,69,0.6)]">
                <div className="absolute inset-0 opacity-[0.06] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                <span className="absolute left-0 top-0 h-1 w-16 bg-[#CC1414] transition-all duration-500 group-hover:w-32" />
                <div className="relative z-10">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur">
                    <i className="ri-heart-line text-2xl" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
                    Pillar 02
                  </span>
                  <h3 className="mt-2 font-serif text-xl font-bold md:text-2xl">{mission2Title}</h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-white/70 md:text-base">
                    {mission2Content}
              </p>
            </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────────── */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 md:mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-10 bg-[#CC1414]" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#CC1414]">
                  Our Values
                </span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-primary md:text-5xl">
                {valuesTitle}
              </h2>
              <p className="mt-3 text-gray-500 font-light md:text-lg">{valuesSubtitle}</p>
            </div>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 self-start rounded-full bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#1ABCDF]"
            >
              Start Shopping
              <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 md:p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#1ABCDF]/30 hover:shadow-[0_20px_40px_-15px_rgba(26,188,223,0.15)]">
                  <span className="absolute left-0 top-0 h-1 w-10 bg-[#1ABCDF] transition-all duration-500 group-hover:w-24" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                    0{i + 1}
                  </span>
                  <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary transition-all duration-500 group-hover:bg-[#1ABCDF] group-hover:text-white">
                    <i className={`${value.icon} text-2xl`} />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-bold text-primary">{value.title}</h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-gray-500">
                    {value.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}

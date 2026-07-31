'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useCMS } from '@/context/CMSContext';
import { db } from '@/lib/app-client';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import ScrollReveal from '@/components/ScrollReveal';
import { HERO_IMAGES_OTHER_PAGES } from '@/lib/hero-images';
import {
  DEFAULT_CONTACT_ADDRESS,
  DEFAULT_CONTACT_PHONE,
  toWhatsAppNumber,
} from '@/lib/contact';

interface TeamContact {
  name: string;
  phone: string;
  role: string;
}

const SUBJECT_OPTIONS = [
  'Product Inquiry',
  'Wholesale / Bulk Quote',
  'Order Support',
  'Partnership',
  'Other',
];

export default function ContactPage() {
  usePageTitle('Contact Us');
  const { getSetting, getSettingJSON } = useCMS();
  const { getToken, verifying } = useRecaptcha();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // ── CMS-driven config ──
  const contactEmail = getSetting('contact_email') || 'info@badawiasimports.com';
  const contactPhone = getSetting('contact_phone') || DEFAULT_CONTACT_PHONE;
  const contactAddress = getSetting('contact_address') || DEFAULT_CONTACT_ADDRESS;
  const heroTitle = getSetting('contact_hero_title') || 'Get In Touch';
  const heroSubtitle =
    getSetting('contact_hero_subtitle') ||
    "We'd love to hear from you. Our team is always here to help — fast.";
  const contactHours =
    getSetting('contact_hours') || 'Tuesday – Saturday · 8:30 AM – 6:00 PM';
  const contactMapLink =
    getSetting('contact_map_link') ||
    process.env.NEXT_PUBLIC_STORE_MAP_LINK ||
    'https://maps.google.com/?q=Tamale+Ghana';
  const teamContacts = getSettingJSON('contact_team_json', []) as TeamContact[];

  const waNumber = toWhatsAppNumber(contactPhone);
  const telNumber = (contactPhone || '').replace(/\s/g, '');

  const quickContacts = [
    {
      icon: 'ri-phone-line',
      label: 'Phone',
      value: contactPhone,
      description: 'Mon–Sat, 9am–6pm',
      link: `tel:${telNumber}`,
      accent: 'from-[#1ABCDF]/30 to-transparent',
      external: false,
    },
    {
      icon: 'ri-mail-line',
      label: 'Email',
      value: contactEmail,
      description: 'Reply within 24 hours',
      link: `mailto:${contactEmail}`,
      accent: 'from-[#CC1414]/30 to-transparent',
      external: false,
    },
    {
      icon: 'ri-whatsapp-line',
      label: 'WhatsApp',
      value: contactPhone,
      description: 'Instant chat support',
      link: `https://wa.me/${waNumber}`,
      accent: 'from-emerald-400/30 to-transparent',
      external: true,
    },
    {
      icon: 'ri-map-pin-line',
      label: 'Visit',
      value: contactAddress,
      description: contactHours,
      link: contactMapLink,
      accent: 'from-indigo-400/30 to-transparent',
      external: true,
    },
  ];

  const hubs = [
    {
      city: getSetting('hub_tamale_name') || 'Tamale',
      role: 'Flagship Showroom · Northern Hub',
      address:
        getSetting('hub_tamale_address') ||
        'Tamale, Northern Region, Ghana',
      hours: getSetting('hub_tamale_hours') || contactHours,
      icon: 'ri-store-3-line',
      link:
        getSetting('hub_tamale_map') ||
        contactMapLink ||
        'https://maps.google.com/?q=Tamale+Ghana',
    },
    {
      city: getSetting('hub_accra_name') || 'Accra',
      role: 'Distribution & Wholesale Center',
      address:
        getSetting('hub_accra_address') ||
        'Greater Accra, Ghana',
      hours: getSetting('hub_accra_hours') || contactHours,
      icon: 'ri-building-2-line',
      link:
        getSetting('hub_accra_map') ||
        'https://maps.google.com/?q=Accra+Ghana',
    },
  ];

  const faqs = [
    {
      question: 'What are your delivery times?',
      answer:
        'Standard delivery takes 2–5 business days. Express delivery offers next-day service in major cities.',
    },
    {
      question: 'Do you offer international shipping?',
      answer:
        'We currently serve across Ghana. Visit our shipping page for current delivery areas.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'Mobile Money (MTN, Vodafone, AirtelTigo) and credit/debit cards through our secure Moolre payment gateway.',
    },
    {
      question: 'Do you do wholesale / bulk pricing?',
      answer:
        'Yes — reach our concierge on WhatsApp or submit the form below with the "Wholesale / Bulk Quote" subject.',
    },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const isHuman = await getToken('contact');
    if (!isHuman) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await db.from('contact_submissions').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });
      if (error) {
        console.log('Note: contact_submissions table may not exist');
      }

      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact', payload: formData }),
      }).catch((err) => console.error('Contact notification error:', err));

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      {/* ── Editorial Hero ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#060E28] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={HERO_IMAGES_OTHER_PAGES[3]}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top_left,_#1ABCDF_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_right,_#CC1414_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="absolute -top-40 -left-20 h-[420px] w-[420px] rounded-full bg-[#1ABCDF]/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-20 h-[420px] w-[420px] rounded-full bg-[#CC1414]/10 blur-3xl animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-14 md:pt-24 md:pb-20">
          <nav className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/50">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <i className="ri-arrow-right-s-line" />
            <span className="text-[#1ABCDF]">Contact</span>
          </nav>

          <div className="grid items-end gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-12 bg-[#1ABCDF]" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1ABCDF]">
                  Human Support, Always
                </span>
              </div>
              <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                {heroTitle.split(' ').slice(0, -1).join(' ') || 'Get In'} <br className="hidden md:block" />
                <span className="italic font-light bg-gradient-to-r from-white to-[#1ABCDF] bg-clip-text text-transparent">
                  {heroTitle.split(' ').slice(-1).join(' ') || 'Touch.'}
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base font-light text-white/60 md:text-lg">{heroSubtitle}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#message"
                  className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-primary transition-all duration-500 hover:-translate-y-0.5 hover:bg-[#1ABCDF] hover:text-white"
                >
                  Send a Message
                  <i className="ri-arrow-down-line transition-transform group-hover:translate-y-0.5" />
                </a>
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/[0.04] px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:border-white/60 hover:bg-white/10"
                >
                  <i className="ri-whatsapp-line" /> Quick WhatsApp
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Response</div>
                <div className="mt-1 font-serif text-2xl font-bold text-white">&lt; 24h</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Hubs</div>
                <div className="mt-1 font-serif text-2xl font-bold text-white">Tamale · Accra</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Languages</div>
                <div className="mt-1 font-serif text-2xl font-bold text-white">EN · DAG</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Hours</div>
                <div className="mt-1 font-serif text-lg font-bold text-white leading-tight">{contactHours}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Contact Rail ───────────────────────────────── */}
      <section className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickContacts.map((qc) => (
              <a
                key={qc.label}
                href={qc.link}
                target={qc.external ? '_blank' : undefined}
                rel={qc.external ? 'noopener noreferrer' : undefined}
                className="group relative block overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_40px_-15px_rgba(13,27,69,0.2)]"
              >
                <span className={`absolute inset-x-0 top-0 h-24 -z-0 bg-gradient-to-b ${qc.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-colors duration-500 group-hover:bg-primary group-hover:text-white">
                    <i className={`${qc.icon} text-2xl`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{qc.label}</p>
                    <p className="mt-1 truncate font-serif text-lg font-bold text-primary">{qc.value}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{qc.description}</p>
                  </div>
                </div>
                <span className="absolute bottom-5 right-5 text-primary/0 transition-all duration-500 group-hover:text-primary group-hover:translate-x-1">
                  <i className="ri-arrow-right-up-line text-lg" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + Support column ───────────────────────────── */}
      <section id="message" className="pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            {/* Form card */}
            <ScrollReveal direction="up">
              <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_-30px_rgba(13,27,69,0.25)]">
                <span className="absolute left-0 top-0 h-1 w-24 bg-[#1ABCDF]" />
                <div className="mb-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1ABCDF]">
                    Send a Message
                  </span>
                  <h2 className="mt-2 font-serif text-3xl font-bold text-primary md:text-4xl">
                    Let's start a conversation
                  </h2>
                  <p className="mt-2 text-gray-500">
                    Tell us what you need — products, bulk orders, support. We read every message.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <FieldWithIcon
                      id="name"
                      label="Full Name"
                      icon="ri-user-3-line"
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(v) => setFormData({ ...formData, name: v })}
                    />
                    <FieldWithIcon
                      id="email"
                      label="Email Address"
                      icon="ri-mail-line"
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(v) => setFormData({ ...formData, email: v })}
                    />
                  </div>

                  <FieldWithIcon
                    id="phone"
                    label="Phone Number"
                    icon="ri-phone-line"
                    type="tel"
                    placeholder="e.g. 0539 781 532"
                    value={formData.phone}
                    onChange={(v) => setFormData({ ...formData, phone: v })}
                  />

                  {/* Subject chip picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
                      Subject
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECT_OPTIONS.map((opt) => {
                        const active = formData.subject === opt;
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => setFormData({ ...formData, subject: opt })}
                            className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                              active
                                ? 'border-primary bg-primary text-white shadow-[0_8px_20px_-8px_rgba(13,27,69,0.5)]'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full resize-none rounded-2xl border border-gray-200 bg-[#F7F8FC] px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                      placeholder="Tell us about your inquiry — products, quantities, timeline…"
                    />
                  </div>

                  {submitStatus === 'success' && (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
                      <i className="ri-checkbox-circle-fill text-xl" />
                      <div>
                        <p className="font-bold">Message sent!</p>
                        <p className="text-sm">We'll get back to you within 24 hours.</p>
                      </div>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
                      <i className="ri-error-warning-fill text-xl" />
                      <div>
                        <p className="font-bold">Couldn't send message</p>
                        <p className="text-sm">Please try again or reach us directly on WhatsApp.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-gray-400">
                      Protected by reCAPTCHA. Your data is private.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting || verifying}
                      className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#1ABCDF] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting || verifying ? (
                        <>
                          <i className="ri-loader-4-line animate-spin text-base" />
                          {verifying ? 'Verifying…' : 'Sending…'}
                        </>
                      ) : (
                        <>
                          Send Message
                          <i className="ri-send-plane-fill text-base transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </ScrollReveal>

            {/* Support column (sticky) */}
            <ScrollReveal direction="up">
              <div className="sticky top-28 flex flex-col gap-5">
                {/* Response times */}
                <div className="rounded-3xl border border-gray-100 bg-[#F7F8FC] p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1ABCDF]/10 text-[#1ABCDF]">
                      <i className="ri-time-line text-xl" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Typical Response
                      </p>
                      <p className="font-serif text-lg font-bold text-primary">Under 24 hours</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">
                    Our concierge team reads every message. For urgent needs, WhatsApp gives the fastest reply.
                  </p>
                </div>

                {/* Opening hours */}
                <div className="rounded-3xl border border-gray-100 bg-white p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Opening Hours</p>
                  <h3 className="mt-1 font-serif text-xl font-bold text-primary">We're here to help</h3>
                  <p className="mt-3 text-sm text-gray-500">{contactHours}</p>
                </div>

                {/* Team contacts */}
                {teamContacts.length > 0 && (
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#060E28] via-[#0A1438] to-[#1ABCDF]/30 p-6 text-white shadow-[0_20px_50px_-30px_rgba(13,27,69,0.5)]">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                        <i className="ri-user-voice-line text-lg" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
                          Direct Lines
                        </p>
                        <p className="font-serif text-xl font-bold">Talk to a specialist</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {teamContacts.map((contact) => (
                        <div
                          key={contact.name}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur"
                        >
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                              {contact.role}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={`tel:${contact.phone}`}
                              aria-label={`Call ${contact.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white hover:text-primary"
                            >
                              <i className="ri-phone-line text-sm" />
                            </a>
                            <a
                              href={`https://wa.me/${toWhatsAppNumber(contact.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`WhatsApp ${contact.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white hover:text-primary"
                            >
                              <i className="ri-whatsapp-line text-sm" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WhatsApp quick card */}
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50 p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(16,185,129,0.35)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <i className="ri-whatsapp-fill text-xl" />
                    </div>
                    <div>
                      <p className="font-serif text-lg font-bold text-emerald-900">Chat on WhatsApp</p>
                      <p className="text-xs text-emerald-700/80">Fastest way to reach a human</p>
                    </div>
                  </div>
                  <i className="ri-arrow-right-up-line text-2xl text-emerald-700 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Hubs / Locations ─────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-[#F7F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-[#CC1414]" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#CC1414]">
                Our Hubs
              </span>
              <span className="h-px w-10 bg-[#CC1414]" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">Visit us in person</h2>
            <p className="mx-auto mt-2 max-w-xl text-gray-500">
              Two strategic locations — one handshake away from your next favorite import.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {hubs.map((hub) => (
              <ScrollReveal key={hub.city}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 md:p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(13,27,69,0.25)]">
                  <span className="absolute left-0 top-0 h-1 w-16 bg-[#1ABCDF] transition-all duration-500 group-hover:w-32" />
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-colors duration-500 group-hover:bg-primary group-hover:text-white">
                      <i className={`${hub.icon} text-2xl`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        {hub.role}
                      </p>
                      <h3 className="font-serif text-2xl font-bold text-primary md:text-3xl">{hub.city}</h3>

                      <div className="mt-5 space-y-2 text-sm text-gray-600">
                        <p className="flex items-start gap-2">
                          <i className="ri-map-pin-2-line mt-0.5 text-[#CC1414]" />
                          <span>{hub.address}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <i className="ri-time-line mt-0.5 text-[#1ABCDF]" />
                          <span>{hub.hours}</span>
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2">
                        <a
                          href={hub.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#1ABCDF]"
                        >
                          <i className="ri-map-pin-line" /> Open in Maps
                        </a>
                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 transition-colors hover:border-emerald-500 hover:text-emerald-600"
                        >
                          <i className="ri-whatsapp-line" /> Chat
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-10 bg-[#1ABCDF]" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1ABCDF]">
                  Common Questions
                </span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">
                Frequently Asked Questions
              </h2>
            </div>
            <a
              href="#message"
              className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary transition-colors hover:text-[#1ABCDF]"
            >
              Didn't find an answer?
              <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-3xl border border-gray-100 bg-white transition-colors hover:border-primary/20"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                  <span className="font-serif text-base font-bold text-primary md:text-lg">
                    {faq.question}
                  </span>
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary transition-all group-open:rotate-180 group-open:bg-primary group-open:text-white">
                    <i className="ri-arrow-down-s-line" />
                  </span>
                </summary>
                <div className="border-t border-gray-50 px-6 pb-6 pt-3 text-sm leading-relaxed text-gray-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Concierge CTA card ──────────────────────────────── */}
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
                    Prefer to skip the form?
                  </h2>
                  <p className="mt-3 max-w-lg text-base font-light text-white/70">
                    Tap WhatsApp for instant chat, or give us a ring — our team is standing by during business hours.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-7 py-4 text-xs font-black uppercase tracking-widest text-primary transition-colors hover:bg-[#1ABCDF] hover:text-white md:w-auto"
                  >
                    <i className="ri-whatsapp-fill text-base" />
                    Start WhatsApp
                  </a>
                  <a
                    href={`tel:${telNumber}`}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/25 bg-white/[0.04] px-7 py-4 text-xs font-black uppercase tracking-widest text-white transition-colors hover:border-white/60 hover:bg-white/10 md:w-auto"
                  >
                    <i className="ri-phone-fill text-base" /> Call Us
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}

/* ── Input with leading icon ──────────────────────────────── */
function FieldWithIcon({
  id,
  label,
  icon,
  type = 'text',
  required = false,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  icon: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
        {label}
      </label>
      <div className="relative">
        <i className={`${icon} pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400`} />
        <input
          id={id}
          type={type}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-[#F7F8FC] py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
        />
      </div>
    </div>
  );
}

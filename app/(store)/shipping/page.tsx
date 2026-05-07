'use client';

import Link from 'next/link';
import { useCMS } from '@/context/CMSContext';
import { toWhatsAppNumber } from '@/lib/contact';
import AnimatedSection from '@/components/AnimatedSection';

export default function ShippingPage() {
  const { getSetting } = useCMS();
  const contactPhone = getSetting('contact_phone') || '';
  const telHref = contactPhone && toWhatsAppNumber(contactPhone) ? `tel:+${toWhatsAppNumber(contactPhone)}` : '#';

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-gray-50 via-white to-amber-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Shipping &amp; Delivery</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Delivery rates for small and big packages across Accra and nearby areas.
            </p>
          </AnimatedSection>
        </div>
      </div>

      <AnimatedSection direction="up" delay={0.1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 space-y-8 prose prose-gray max-w-none hover-lift">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Small packages</h2>
              <ul className="list-none space-y-3 p-0 m-0">
                <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3 border-b border-gray-100">
                  <span className="text-gray-800 font-medium">Within Accra</span>
                  <span className="text-lg font-bold text-primary">GH₵ 50</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3 border-b border-gray-100">
                  <span className="text-gray-800 font-medium">Tema / Ashiaman</span>
                  <span className="text-lg font-bold text-primary">GH₵ 100</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3 border-b border-gray-100">
                  <span className="text-gray-800 font-medium">Pokuase / Amasaman</span>
                  <span className="text-lg font-bold text-primary">GH₵ 80</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3">
                  <span className="text-gray-800 font-medium">Station fee</span>
                  <span className="text-lg font-bold text-primary">GH₵ 10</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Big packages</h2>
              <p className="text-gray-800 text-lg font-semibold m-0">
                GH₵ 100 and above
              </p>
              <p className="text-gray-600 text-sm mt-2 mb-0">
                Large or heavy items are charged at this rate (or higher as agreed). Contact us if you’re unsure which category applies.
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed mb-0">
              Rates apply per delivery where stated. For questions or custom arrangements, please contact us. {contactPhone && (
                <>Call us at <a href={telHref} className="text-gray-900 font-semibold hover:underline">{contactPhone}</a>.</>
              )}
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              Contact us
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { money } from '@/lib/format-money';
import { db } from '@/lib/app-client';
import Link from 'next/link';

interface ProductSale {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  status: string;
  product_images: { url: string; position: number }[];
}

export default function SalePricingPage() {
  const [saleEnabled, setSaleEnabled] = useState(false);
  const [saleBannerText, setSaleBannerText] = useState('STORE-WIDE SALE — Up to 50% OFF Everything!');
  const [saleEndDate, setSaleEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductSale[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await db
        .from('store_settings')
        .select('key, value')
        .in('key', ['store_wide_sale_enabled', 'sale_banner_text', 'sale_end_date']);

      if (data) {
        data.forEach((row: { key: string; value: unknown }) => {
          const v = row.value != null ? String(row.value) : '';
          if (row.key === 'store_wide_sale_enabled') setSaleEnabled(v === 'true');
          if (row.key === 'sale_banner_text' && v) setSaleBannerText(v);
          if (row.key === 'sale_end_date' && v) setSaleEndDate(v);
        });
      }
    } catch (err) {
      console.error('Failed to fetch sale settings:', err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await db
        .from('products')
        .select('id, name, price, sale_price, status, product_images(url, position)')
        .eq('status', 'active')
        .order('name');

      if (data) setProducts(data as ProductSale[]);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSettings(), fetchProducts()]).then(() => setLoading(false));
  }, [fetchSettings, fetchProducts]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: 'store_wide_sale_enabled', value: saleEnabled ? 'true' : 'false' },
        { key: 'sale_banner_text', value: saleBannerText },
        { key: 'sale_end_date', value: saleEndDate || '' },
      ];

      for (const s of settings) {
        const { error } = await db.from('store_settings').upsert(
          { key: s.key, value: s.value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
        if (error) throw error;
      }

      showToast('success', 'Sale settings saved successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = () => {
    setSaleEnabled(prev => !prev);
  };

  const updateProductSalePrice = async (productId: string, newSalePrice: string) => {
    const value = newSalePrice ? parseFloat(newSalePrice) : null;
    const { error } = await db
      .from('products')
      .update({ sale_price: value })
      .eq('id', productId);

    if (error) {
      showToast('error', 'Failed to update sale price');
      return;
    }

    setProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, sale_price: value } : p)
    );
  };

  const productsWithSale = products.filter(p => p.sale_price && p.sale_price > 0);
  const productsWithoutSale = products.filter(p => !p.sale_price || p.sale_price <= 0);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <i className="ri-loader-4-line animate-spin text-2xl"></i>
          <span>Loading sale settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <i className={toast.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'}></i>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <i className="ri-fire-line text-red-500"></i>
            Sale Pricing
          </h1>
          <p className="text-gray-600 mt-1">Manage your store-wide sale and set sale prices for individual products</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              Saving...
            </>
          ) : (
            <>
              <i className="ri-save-line"></i>
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* ── Master Toggle Card ──────────────── */}
      <div className={`rounded-2xl border-2 p-6 transition-colors ${saleEnabled ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${saleEnabled ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              <i className={`text-2xl ${saleEnabled ? 'ri-fire-fill' : 'ri-fire-line'}`}></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Store-wide Sale</h2>
              <p className="text-gray-600 text-sm mt-0.5">
                {saleEnabled
                  ? 'Sale is ACTIVE — products with sale prices will show discounted prices on the storefront'
                  : 'Sale is OFF — all products show their regular prices'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            className={`relative w-16 h-8 rounded-full transition-colors cursor-pointer ${saleEnabled ? 'bg-red-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${saleEnabled ? 'left-9' : 'left-1'}`} />
          </button>
        </div>

        {/* Banner Text & End Date */}
        {saleEnabled && (
          <div className="mt-6 pt-6 border-t border-red-200 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sale Banner Text
              </label>
              <input
                type="text"
                value={saleBannerText}
                onChange={(e) => setSaleBannerText(e.target.value)}
                className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white"
                placeholder="e.g. STORE-WIDE SALE — Up to 50% OFF!"
              />
              <p className="text-sm text-gray-500 mt-1">This text appears in the sale banner at the top of your store</p>
            </div>
            <div className="max-w-sm">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sale End Date (optional)
              </label>
              <input
                type="datetime-local"
                value={saleEndDate}
                onChange={(e) => setSaleEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white"
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty for no expiry</p>
            </div>

            {/* Banner Preview */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Banner Preview:</p>
              <div className="bg-red-600 text-white text-center py-2.5 px-4 rounded-lg text-sm font-semibold tracking-wide">
                {saleBannerText}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Products with Sale Prices ────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <i className="ri-price-tag-3-fill text-red-500"></i>
            Products with Sale Prices
            <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">{productsWithSale.length}</span>
          </h3>
        </div>

        {productsWithSale.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <i className="ri-price-tag-3-line text-4xl mb-2 block"></i>
            <p>No products have sale prices set yet.</p>
            <p className="text-sm mt-1">Set sale prices on individual products below or in the product editor.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {productsWithSale.map(product => {
              const discount = ((product.price - (product.sale_price || product.price)) / product.price * 100).toFixed(0);
              const img = product.product_images?.sort((a, b) => a.position - b.position)?.[0]?.url;
              return (
                <div key={product.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {img ? (
                      <img src={img} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <i className="ri-image-line"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-gray-400 line-through">GH₵{money(product.price)}</span>
                      <span className="text-sm font-bold text-red-600">GH₵{money(product.sale_price)}</span>
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">{discount}% OFF</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">GH₵</span>
                      <input
                        type="number"
                        defaultValue={product.sale_price || ''}
                        onBlur={(e) => updateProductSalePrice(product.id, e.target.value)}
                        className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      onClick={() => updateProductSalePrice(product.id, '')}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove sale price"
                    >
                      <i className="ri-close-circle-line text-lg"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── All Other Products ────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <i className="ri-box-3-line text-gray-500"></i>
            Products Without Sale Price
            <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">{productsWithoutSale.length}</span>
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">Set sale prices quickly — these products will use their regular price during sales</p>
        </div>

        {productsWithoutSale.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>All products have sale prices!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {productsWithoutSale.map(product => {
              const img = product.product_images?.sort((a, b) => a.position - b.position)?.[0]?.url;
              return (
                <div key={product.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {img ? (
                      <img src={img} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <i className="ri-image-line"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">Regular: GH₵{money(product.price)}</p>
                  </div>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">GH₵</span>
                    <input
                      type="number"
                      onBlur={(e) => {
                        if (e.target.value) updateProductSalePrice(product.id, e.target.value);
                      }}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400"
                      step="0.01"
                      placeholder="Sale price"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
        <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
          <i className="ri-information-line"></i>
          How Sale Pricing Works
        </h4>
        <ul className="space-y-1.5 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <i className="ri-checkbox-circle-fill text-blue-500 mt-0.5"></i>
            Toggle the <strong>Store-wide Sale</strong> switch ON to activate sale prices across the storefront
          </li>
          <li className="flex items-start gap-2">
            <i className="ri-checkbox-circle-fill text-blue-500 mt-0.5"></i>
            Products with a sale price set will show the discounted price with a strikethrough on the regular price
          </li>
          <li className="flex items-start gap-2">
            <i className="ri-checkbox-circle-fill text-blue-500 mt-0.5"></i>
            Products without a sale price will continue showing their regular price
          </li>
          <li className="flex items-start gap-2">
            <i className="ri-checkbox-circle-fill text-blue-500 mt-0.5"></i>
            A sale banner will appear at the top of the store when the sale is active
          </li>
          <li className="flex items-start gap-2">
            <i className="ri-checkbox-circle-fill text-blue-500 mt-0.5"></i>
            You can also set sale prices individually from the product editor (Pricing tab)
          </li>
        </ul>
      </div>
    </div>
  );
}

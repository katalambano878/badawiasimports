'use client';

import Link from 'next/link';
import { money } from '@/lib/format-money';
import { useState, useEffect } from 'react';
import { db } from '@/lib/app-client';
import { useRouter } from 'next/navigation';

interface ProductFormProps {
    initialData?: any;
    isEditMode?: boolean;
}

export default function ProductForm({ initialData, isEditMode = false }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [productName, setProductName] = useState(initialData?.name || '');
    const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
    const [price, setPrice] = useState(initialData?.price || '');
    const [comparePrice, setComparePrice] = useState(initialData?.compare_at_price || '');
    const [salePrice, setSalePrice] = useState(initialData?.sale_price || '');
    const [sku, setSku] = useState(initialData?.sku || '');
    const [stock, setStock] = useState(initialData?.quantity || '');
    const [moq, setMoq] = useState(initialData?.moq || '1');
    const [lowStockThreshold, setLowStockThreshold] = useState(initialData?.metadata?.low_stock_threshold || '5');
    const [description, setDescription] = useState(initialData?.description || '');
    const [status, setStatus] = useState(initialData?.status || 'Active');
    const [featured, setFeatured] = useState(initialData?.featured || false);
    const [preorderShipping, setPreorderShipping] = useState(initialData?.metadata?.preorder_shipping || '');
    const [activeTab, setActiveTab] = useState('general');

    // Auto-generate SKU function
    const generateSku = () => {
        const prefix = process.env.NEXT_PUBLIC_SKU_PREFIX || 'SKU';
        const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    };

    // ── Preset Colors ──────────
    const PRESET_COLORS: { name: string; hex: string }[] = [
        { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' },
        { name: 'Red', hex: '#EF4444' }, { name: 'Blue', hex: '#3B82F6' },
        { name: 'Navy', hex: '#1E3A5F' }, { name: 'Green', hex: '#22C55E' },
        { name: 'Yellow', hex: '#EAB308' }, { name: 'Pink', hex: '#EC4899' },
        { name: 'Purple', hex: '#A855F7' }, { name: 'Orange', hex: '#F97316' },
        { name: 'Gray', hex: '#6B7280' }, { name: 'Brown', hex: '#92400E' },
        { name: 'Beige', hex: '#D4A574' }, { name: 'Maroon', hex: '#7F1D1D' },
        { name: 'Teal', hex: '#14B8A6' }, { name: 'Cream', hex: '#FFFDD0' },
        { name: 'Gold', hex: '#D4A017' }, { name: 'Silver', hex: '#C0C0C0' },
    ];

    const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

    // Selected colors: array of { name, hex, image? }
    // image is an optional photo of the product in this specific color. When the
    // shopper clicks the color swatch on the storefront, the main product image
    // swaps to this photo.
    const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string; image?: string }[]>(() => {
        const stored = initialData?.metadata?.selected_colors as { name: string; hex: string; image?: string }[] | undefined;
        return stored || [];
    });

    const [uploadingColorName, setUploadingColorName] = useState<string | null>(null);
    const [colorUploadError, setColorUploadError] = useState<string | null>(null);

    // Selected sizes: array of strings
    const [selectedSizes, setSelectedSizes] = useState<string[]>(() => {
        const stored = initialData?.metadata?.selected_sizes as string[] | undefined;
        return stored || [];
    });

    // Custom color input
    const [customColorName, setCustomColorName] = useState('');
    const [customColorHex, setCustomColorHex] = useState('#6B7280');

    // Custom size input
    const [customSizeInput, setCustomSizeInput] = useState('');

    const toggleColor = (color: { name: string; hex: string }) => {
        setSelectedColors(prev => {
            const exists = prev.some(c => c.name === color.name);
            return exists ? prev.filter(c => c.name !== color.name) : [...prev, color];
        });
    };

    const addCustomColor = () => {
        const name = customColorName.trim();
        if (!name) return;
        if (selectedColors.some(c => c.name === name)) return;
        setSelectedColors(prev => [...prev, { name, hex: customColorHex }]);
        setCustomColorName('');
    };

    const handleColorImageUpload = async (colorName: string, file: File) => {
        setColorUploadError(null);
        if (file.size > 5 * 1024 * 1024) {
            setColorUploadError(`${colorName}: file too large (max 5MB).`);
            return;
        }
        if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
            setColorUploadError(`${colorName}: only JPG/PNG/GIF/WebP allowed.`);
            return;
        }
        setUploadingColorName(colorName);
        try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
            const safe = colorName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
            const path = `products/colors/${safe}-${Date.now()}.${ext}`;
            const { error: uploadErr } = await db.storage
                .from('media')
                .upload(path, file, { cacheControl: '3600', upsert: true });
            if (uploadErr) throw uploadErr;
            const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(path);
            setSelectedColors(prev => prev.map(c => c.name === colorName ? { ...c, image: publicUrl } : c));
        } catch (err: any) {
            console.error('[ColorImage] upload failed', err);
            setColorUploadError(`${colorName}: upload failed (${err?.message || 'unknown error'}).`);
        } finally {
            setUploadingColorName(null);
        }
    };

    const removeColorImage = (colorName: string) => {
        setSelectedColors(prev => prev.map(c => c.name === colorName ? { ...c, image: undefined } : c));
    };

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const addCustomSize = () => {
        const size = customSizeInput.trim();
        if (!size || selectedSizes.includes(size)) return;
        setSelectedSizes(prev => [...prev, size]);
        setCustomSizeInput('');
    };

    // Build variant-generating groups from selected colors & sizes.
    // ORDER MATTERS: storefront expects option1=Size, option2=Color.
    // Color values are stored as "Name|#hex" so the storefront can render swatches without lookups.
    const activeGroups: { name: string; values: string[]; isColor?: boolean }[] = [];
    if (selectedSizes.length > 0) activeGroups.push({ name: 'Size', values: selectedSizes });
    if (selectedColors.length > 0) {
        activeGroups.push({
            name: 'Color',
            // Pipe-separated: "Name|hex|imageUrl". The third part is optional — when
            // present the storefront swaps the main product photo to it.
            values: selectedColors.map(c => `${c.name}|${c.hex}${c.image ? `|${c.image}` : ''}`),
            isColor: true,
        });
    }

    const existingVariants = (initialData?.product_variants || []).map((v: any) => ({
        ...v,
        stock: v.stock ?? v.quantity ?? 0,
    }));

    // Variant data map keyed by joined option values
    const [variantData, setVariantData] = useState<Record<string, { price: string; stock: string; sku: string }>>(() => {
        const data: Record<string, { price: string; stock: string; sku: string }> = {};
        const storedNames: string[] = initialData?.metadata?.option_names || [];
        (initialData?.product_variants || []).forEach((v: any) => {
            const values = storedNames
                .map((_: string, idx: number) => (v[`option${idx + 1}`] as string) || '')
                .filter(Boolean);
            if (values.length > 0) {
                data[values.join('|||')] = {
                    price: v.price?.toString() || '',
                    stock: (v.stock ?? v.quantity ?? 0).toString(),
                    sku: v.sku || '',
                };
            }
        });
        return data;
    });

    const cartesian = (arrays: string[][]): string[][] => {
        if (arrays.length === 0) return [[]];
        const [first, ...rest] = arrays;
        const restProduct = cartesian(rest);
        return first.flatMap(item => restProduct.map(combo => [item, ...combo]));
    };

    const variantCombinations = activeGroups.length > 0
        ? cartesian(activeGroups.map(g => g.values)).map(values => ({
            values,
            key: values.join('|||'),
        }))
        : [];

    const variants = variantCombinations.map(combo => {
        const d = variantData[combo.key] || { price: price?.toString() || '', stock: '0', sku: '' };
        return { values: combo.values, sku: d.sku, price: d.price || price?.toString() || '', stock: d.stock || '0' };
    });

    const updateVariantField = (key: string, field: string, value: string) => {
        setVariantData(prev => ({
            ...prev,
            [key]: { ...prev[key] || { price: price?.toString() || '', stock: '0', sku: '' }, [field]: value },
        }));
    };

    const bulkSetField = (field: 'price' | 'stock', value: string) => {
        setVariantData(prev => {
            const updated = { ...prev };
            variantCombinations.forEach(combo => {
                updated[combo.key] = { ...updated[combo.key] || { price: price?.toString() || '', stock: '0', sku: '' }, [field]: value };
            });
            return updated;
        });
    };

    // Images
    const [images, setImages] = useState<any[]>(initialData?.product_images || []);
    const [uploading, setUploading] = useState(false);

    // SEO
    const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || '');
    const [metaDescription, setMetaDescription] = useState(initialData?.seo_description || '');
    const [urlSlug, setUrlSlug] = useState(initialData?.slug || '');
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData?.slug);
    const [keywords, setKeywords] = useState(initialData?.tags?.join(', ') || '');

    const tabs = [
        { id: 'general', label: 'General', icon: 'ri-information-line' },
        { id: 'pricing', label: 'Pricing & Inventory', icon: 'ri-price-tag-3-line' },
        { id: 'variants', label: 'Variants', icon: 'ri-layout-grid-line' },
        { id: 'images', label: 'Images', icon: 'ri-image-line' },
        { id: 'seo', label: 'SEO', icon: 'ri-search-line' }
    ];

    // Fetch categories on mount
    useEffect(() => {
        async function fetchCategories() {
            const { data } = await db.from('categories').select('id, name').eq('status', 'active');
            if (data) {
                setCategories(data);
                if (data.length > 0 && !categoryId) {
                    setCategoryId(data[0].id);
                }
            }
        }
        fetchCategories();
    }, [categoryId]);

    const generateSlug = (text: string) =>
        text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Auto-generate slug from name unless admin manually edited it
    useEffect(() => {
        if (!slugManuallyEdited && productName) {
            setUrlSlug(generateSlug(productName));
        }
    }, [productName, slugManuallyEdited]);

    // Auto-generate SKU for new products
    useEffect(() => {
        if (!isEditMode && !sku) {
            setSku(generateSku());
        }
    }, [isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await db.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = db.storage
                .from('products')
                .getPublicUrl(filePath);

            setImages([...images, { url: publicUrl, position: images.length }]);

        } catch (error: any) {
            alert('Error uploading file: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImages(images.filter((_, idx) => idx !== indexToRemove));
    };

    // Variant helpers removed — variants are now auto-generated from selectedColors × selectedSizes

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // If product has variants, auto-sync main stock = sum of variant stocks
            const hasVariants = variants.length > 0;
            const variantStockTotal = hasVariants
                ? variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
                : parseInt(stock) || 0;

            const productData = {
                name: productName,
                slug: urlSlug || generateSlug(productName),
                description,
                category_id: categoryId || null,
                price: parseFloat(price) || 0,
                compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
                sale_price: salePrice ? parseFloat(salePrice) : null,
                sku: sku || generateSku(), // Auto-generate if empty
                quantity: hasVariants ? variantStockTotal : (parseInt(stock) || 0),
                moq: parseInt(moq) || 1,
                status: status.toLowerCase(),
                featured,
                seo_title: seoTitle,
                seo_description: metaDescription,
                tags: (keywords as string).split(',').map((k: string) => k.trim()).filter(Boolean),
                metadata: {
                    low_stock_threshold: parseInt(lowStockThreshold) || 5,
                    preorder_shipping: preorderShipping.trim() || null,
                    option_names: activeGroups.map((g, i) => g.name || `Option ${i + 1}`),
                    selected_colors: selectedColors,
                    selected_sizes: selectedSizes,
                    product_options: selectedColors.length > 0 ? {
                        color: {
                            values: selectedColors.map(c => `${c.name}|${c.hex}${c.image ? `|${c.image}` : ''}`),
                            generatesVariants: true,
                        },
                    } : {},
                    custom_option_groups: selectedSizes.length > 0 ? [
                        { name: 'Size', values: selectedSizes, generatesVariants: true },
                    ] : [],
                }
            };

            let productId = initialData?.id;
            let error;

            if (isEditMode && productId) {
                // Update existing
                const { error: updateError } = await db
                    .from('products')
                    .update(productData)
                    .eq('id', productId);
                error = updateError;
            } else {
                // Create new
                const { data: newProduct, error: insertError } = await db
                    .from('products')
                    .insert([productData])
                    .select()
                    .single();

                if (newProduct) productId = newProduct.id;
                error = insertError;
            }

            if (error) throw error;

            // Update Images
            if (productId) {
                // Strategy: We will just delete all old images/variants and recreate them for simplicity in this MVP.
                // In a clearer implementation, we would diff them.

                // 1. Images
                if (isEditMode) {
                    await db.from('product_images').delete().eq('product_id', productId);
                }
                if (images.length > 0) {
                    const imageInserts = images.map((img, idx) => ({
                        product_id: productId,
                        url: img.url,
                        position: idx,
                        alt_text: productName
                    }));
                    await db.from('product_images').insert(imageInserts);
                }

                // 2. Variants
                if (isEditMode) {
                    // Be careful not to delete ALL variants if we want to preserve IDs etc, 
                    // but for now, full replacement is safer to ensure sync.
                    // Note: This might break order-item references if they rely on variant_id hard constraints without cascading.
                    // Our Schema migration has ON DELETE SET NULL for order_items -> variant_id, so this is safe for now (but distinct from "archiving").
                    await db.from('product_variants').delete().eq('product_id', productId);
                }

                if (variants.length > 0) {
                    const variantInserts = variants.map(v => {
                        // Strip "|hex|image" from any color value so the displayed
                        // variant name stays readable.
                        const displayValues = v.values.map(val => val.includes('|') ? val.split('|')[0] : val);
                        const colorVal = v.values.find(val => val.includes('|'));
                        const [colorName = '', colorHex = '', colorImage = ''] = colorVal ? colorVal.split('|') : [];

                        const meta: Record<string, string> = {};
                        if (colorHex) meta.color_hex = colorHex;
                        if (colorName) meta.color_name = colorName;
                        if (colorImage) meta.color_image = colorImage;

                        return {
                            product_id: productId,
                            name: displayValues.join(' / ') || 'Default',
                            sku: v.sku || null,
                            price: parseFloat(v.price) || 0,
                            quantity: parseInt(v.stock) || 0,
                            // option1/2/3 keep the full encoded "Name|hex|image" string so the
                            // storefront's variant-matching by encoded value continues to work.
                            option1: v.values[0] || null,
                            option2: v.values[1] || null,
                            option3: v.values[2] || null,
                            metadata: Object.keys(meta).length > 0 ? meta : {},
                        };
                    });
                    const { error: varError } = await db.from('product_variants').insert(variantInserts);
                    if (varError) throw varError;
                }
            }

            alert(isEditMode ? 'Product updated successfully!' : 'Product created successfully!');
            router.push('/admin/products');

        } catch (err: any) {
            console.error('Error saving product:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        href="/admin/products"
                        className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                    >
                        <i className="ri-arrow-left-line text-xl text-gray-700"></i>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEditMode ? 'Edit Product' : 'Add New Product'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isEditMode ? 'Update product information and settings' : 'Create a new product for your catalog'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {isEditMode && (
                        <Link
                            href={`/product/${initialData?.id}`}
                            target="_blank"
                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors font-semibold whitespace-nowrap cursor-pointer flex items-center"
                        >
                            <i className="ri-eye-line mr-2"></i>
                            Preview
                        </Link>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`px-6 py-3 bg-primary hover:bg-primary text-white rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <>
                                <i className="ri-loader-4-line animate-spin mr-2"></i>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="ri-save-line mr-2"></i>
                                {isEditMode ? 'Save Changes' : 'Create Product'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 overflow-x-auto">
                    <div className="flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-6 py-4 font-semibold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${activeTab === tab.id
                                    ? 'border-gray-900 text-gray-900 bg-gray-50'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <i className={`${tab.icon} text-xl`}></i>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6 max-w-3xl">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                    maxLength={500}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 resize-none"
                                    placeholder="Describe your product..."
                                />
                                <p className="text-sm text-gray-500 mt-2">{description.length}/500 characters</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full px-4 py-3 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 cursor-pointer"
                                    >
                                        {categories.length === 0 && <option value="">Loading categories...</option>}
                                        {categories.length > 0 && <option value="">Select a category</option>}
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-4 py-3 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 cursor-pointer"
                                    >
                                        <option>Active</option>
                                        <option>Draft</option>
                                        <option>Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={featured}
                                    onChange={(e) => setFeatured(e.target.checked)}
                                    className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-600 cursor-pointer"
                                />
                                <label className="text-gray-900 font-medium">
                                    Feature this product on homepage
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Pre-order / Estimated Shipping
                                </label>
                                <input
                                    type="text"
                                    value={preorderShipping}
                                    onChange={(e) => setPreorderShipping(e.target.value)}
                                    placeholder="e.g., Ships in 14 days, Available March 15"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty if product ships immediately. Otherwise, enter estimated shipping time.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pricing' && (
                        <div className="space-y-6 max-w-3xl">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Price (GH₵) *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">GH₵</span>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="w-full pl-16 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Compare at Price (GH₵)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">GH₵</span>
                                        <input
                                            type="number"
                                            value={comparePrice}
                                            onChange={(e) => setComparePrice(e.target.value)}
                                            className="w-full pl-16 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">Show original price for comparison</p>
                                </div>
                            </div>

                            {/* ── Sale Price ─────────────────── */}
                            <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50/50 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <i className="ri-fire-line text-xl text-red-500"></i>
                                        <h4 className="font-bold text-gray-900">Sale Price</h4>
                                    </div>
                                    <Link
                                        href="/admin/sale-pricing"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                                    >
                                        <i className="ri-toggle-line text-base"></i>
                                        Sale Pricing Toggle
                                        <i className="ri-arrow-right-s-line"></i>
                                    </Link>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Sale Price (GH₵)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 font-semibold">GH₵</span>
                                            <input
                                                type="number"
                                                value={salePrice}
                                                onChange={(e) => setSalePrice(e.target.value)}
                                                className="w-full pl-16 pr-4 py-3 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white"
                                                step="0.01"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1.5">Only active when the store-wide sale toggle is ON.</p>
                                    </div>
                                    <div className="flex items-end">
                                        {salePrice && price && parseFloat(salePrice) < parseFloat(price) ? (
                                            <div className="w-full p-3 bg-white rounded-lg border border-red-200">
                                                <p className="text-sm text-gray-600">Sale Discount</p>
                                                <p className="text-2xl font-bold text-red-600">
                                                    {(((parseFloat(price) - parseFloat(salePrice)) / parseFloat(price)) * 100).toFixed(0)}% OFF
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Save GH₵ {money((parseFloat(price) - parseFloat(salePrice)))}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="w-full p-3 bg-white rounded-lg border border-red-200 text-center">
                                                <p className="text-sm text-gray-400">Set a sale price lower than the regular price to see savings</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-blue-900 font-semibold mb-1">Compare-At Discount</p>
                                {price && comparePrice && parseFloat(comparePrice) > parseFloat(price) ? (
                                    <p className="text-blue-800">
                                        Savings: GH₵ {money((parseFloat(comparePrice) - parseFloat(price)))}
                                        <span className="ml-2">
                                            ({(((parseFloat(comparePrice) - parseFloat(price)) / parseFloat(comparePrice)) * 100).toFixed(0)}% off)
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-blue-800 text-sm">Enter a valid compare price higher than the price to see discount.</p>
                                )}
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Inventory</h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            SKU (Auto-generated)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={sku}
                                                onChange={(e) => setSku(e.target.value)}
                                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 font-mono bg-gray-50"
                                                placeholder="Auto-generated"
                                                readOnly
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSku(generateSku())}
                                                className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                                title="Generate new SKU"
                                            >
                                                <i className="ri-refresh-line text-lg"></i>
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">SKU is auto-generated. Click refresh to generate a new one.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Stock Quantity *
                                        </label>
                                        {variants.length > 0 ? (
                                            <div>
                                                <input
                                                    type="number"
                                                    value={variants.reduce((sum: number, v: any) => sum + (parseInt(v.stock) || 0), 0)}
                                                    readOnly
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                                />
                                                <p className="text-sm text-amber-600 mt-1 flex items-center">
                                                    <i className="ri-information-line mr-1"></i>
                                                    Stock is managed per variant. Edit stock in the Variants tab.
                                                </p>
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                value={stock}
                                                onChange={(e) => setStock(e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                                                placeholder="0"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Minimum Order Quantity (MOQ)
                                        </label>
                                        <input
                                            type="number"
                                            value={moq}
                                            onChange={(e) => setMoq(e.target.value)}
                                            min="1"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                                            placeholder="1"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Minimum quantity customers must order</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Low Stock Threshold
                                        </label>
                                        <input
                                            type="number"
                                            value={lowStockThreshold}
                                            onChange={(e) => setLowStockThreshold(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Get notified when stock falls below this number</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'variants' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Product Variants</h3>
                                <p className="text-gray-600 mt-1">Select colors and sizes below — variants are generated automatically</p>
                            </div>

                            {/* ── Step 1: Select Colors ─────────────────── */}
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <i className="ri-palette-line text-lg text-primary"></i>
                                        Step 1: Select Colors
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-0.5">Click colors to add/remove. Skip if product has no color options.</p>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_COLORS.map(color => {
                                            const isSelected = selectedColors.some(c => c.name === color.name);
                                            const isLight = ['White', 'Cream', 'Beige', 'Yellow', 'Silver'].includes(color.name);
                                            return (
                                                <button
                                                    key={color.name}
                                                    type="button"
                                                    onClick={() => toggleColor(color)}
                                                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium border-2 transition-all cursor-pointer ${isSelected
                                                        ? 'border-gray-900 bg-gray-900 text-white shadow-md scale-105'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                                                        }`}
                                                >
                                                    <span
                                                        className={`w-5 h-5 rounded-full flex-shrink-0 ${isLight ? 'border border-gray-300' : ''}`}
                                                        style={{ backgroundColor: color.hex }}
                                                    />
                                                    {color.name}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                        <input
                                            type="color"
                                            value={customColorHex}
                                            onChange={e => setCustomColorHex(e.target.value)}
                                            className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer p-0.5"
                                        />
                                        <input
                                            type="text"
                                            value={customColorName}
                                            onChange={e => setCustomColorName(e.target.value)}
                                            placeholder="Custom color name"
                                            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                                            onKeyDown={e => e.key === 'Enter' && addCustomColor()}
                                        />
                                        <button
                                            type="button"
                                            onClick={addCustomColor}
                                            disabled={!customColorName.trim()}
                                            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Add Color
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── Step 1.5: Color Photos (Optional) ─────────────────── */}
                            {selectedColors.length > 0 && (
                                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                            <i className="ri-image-2-line text-lg text-primary"></i>
                                            Color Photos <span className="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
                                        </h4>
                                        <p className="text-sm text-gray-500 mt-0.5">Attach a photo to each color. When a shopper picks the color, this photo becomes the main product image.</p>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        {colorUploadError && (
                                            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                                {colorUploadError}
                                            </div>
                                        )}
                                        {selectedColors.map(color => {
                                            const isLight = ['White', 'Cream', 'Beige', 'Yellow', 'Silver'].includes(color.name);
                                            const isUploading = uploadingColorName === color.name;
                                            return (
                                                <div key={color.name} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                                                    <span
                                                        className={`w-8 h-8 rounded-full flex-shrink-0 ${isLight ? 'border border-gray-300' : ''}`}
                                                        style={{ backgroundColor: color.hex }}
                                                    />
                                                    <span className="font-medium text-gray-900 min-w-[80px]">{color.name}</span>

                                                    {color.image ? (
                                                        <>
                                                            <img
                                                                src={color.image}
                                                                alt={`${color.name} preview`}
                                                                className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                                                            />
                                                            <span className="text-xs text-gray-500 flex-1 truncate">Photo attached</span>
                                                            <label className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                                                                Replace
                                                                <input
                                                                    type="file"
                                                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                                                    className="hidden"
                                                                    disabled={isUploading}
                                                                    onChange={e => {
                                                                        const f = e.target.files?.[0];
                                                                        if (f) handleColorImageUpload(color.name, f);
                                                                        e.target.value = '';
                                                                    }}
                                                                />
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeColorImage(color.name)}
                                                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50"
                                                            >
                                                                Remove
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-xs text-gray-400 flex-1">No photo yet</span>
                                                            <label className={`px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 cursor-pointer ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                                                {isUploading ? (
                                                                    <span className="flex items-center gap-1">
                                                                        <i className="ri-loader-4-line animate-spin"></i> Uploading…
                                                                    </span>
                                                                ) : 'Upload Photo'}
                                                                <input
                                                                    type="file"
                                                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                                                    className="hidden"
                                                                    disabled={isUploading}
                                                                    onChange={e => {
                                                                        const f = e.target.files?.[0];
                                                                        if (f) handleColorImageUpload(color.name, f);
                                                                        e.target.value = '';
                                                                    }}
                                                                />
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 2: Select Sizes ─────────────────── */}
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <i className="ri-ruler-line text-lg text-primary"></i>
                                        Step 2: Select Sizes
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-0.5">Click sizes to add/remove. Use custom for volumes (100ml), weights, etc.</p>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_SIZES.map(size => {
                                            const isSelected = selectedSizes.includes(size);
                                            return (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => toggleSize(size)}
                                                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all cursor-pointer ${isSelected
                                                        ? 'border-gray-900 bg-gray-900 text-white shadow-md scale-105'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                        <input
                                            type="text"
                                            value={customSizeInput}
                                            onChange={e => setCustomSizeInput(e.target.value)}
                                            placeholder="Custom size (e.g. 100ml, One Size, 42)"
                                            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                                            onKeyDown={e => e.key === 'Enter' && addCustomSize()}
                                        />
                                        <button
                                            type="button"
                                            onClick={addCustomSize}
                                            disabled={!customSizeInput.trim()}
                                            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Add Size
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Variant Price/Stock Grid */}
                            {variantCombinations.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
                                        <h4 className="text-sm font-bold text-gray-900 flex items-center">
                                            <i className="ri-grid-line mr-2 text-lg text-primary"></i>
                                            Set Price & Stock — {variantCombinations.length} variant{variantCombinations.length > 1 ? 's' : ''}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { const val = prompt('Set price for ALL variants:', price?.toString() || '0'); if (val !== null) bulkSetField('price', val); }}
                                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Bulk Set Price
                                            </button>
                                            <button
                                                onClick={() => { const val = prompt('Set stock for ALL variants:', '0'); if (val !== null) bulkSetField('stock', val); }}
                                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Bulk Set Stock
                                            </button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    {activeGroups.map((g, i) => (
                                                        <th key={i} className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                                            {g.name || `Option ${i + 1}`}
                                                        </th>
                                                    ))}
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Price (GH₵)</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variantCombinations.map((combo) => {
                                                    const d = variantData[combo.key] || { price: price?.toString() || '', stock: '0', sku: '' };
                                                    return (
                                                        <tr key={combo.key} className="border-b border-gray-100 hover:bg-gray-50">
                                                            {combo.values.map((val, vi) => {
                                                                const isColor = val.includes('|');
                                                                const [name, hex] = isColor ? val.split('|') : [val, ''];
                                                                return (
                                                                    <td key={vi} className="py-3 px-4">
                                                                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded">
                                                                            {isColor && (
                                                                                <span
                                                                                    className="w-3.5 h-3.5 rounded-full border border-gray-300"
                                                                                    style={{ backgroundColor: hex }}
                                                                                />
                                                                            )}
                                                                            {name}
                                                                        </span>
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="py-3 px-4">
                                                                <input
                                                                    type="number"
                                                                    value={d.price}
                                                                    onChange={(e) => updateVariantField(combo.key, 'price', e.target.value)}
                                                                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
                                                                    step="0.01"
                                                                    placeholder={price?.toString() || '0'}
                                                                />
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <input
                                                                    type="number"
                                                                    value={d.stock}
                                                                    onChange={(e) => updateVariantField(combo.key, 'stock', e.target.value)}
                                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                                        <p className="text-xs text-gray-800 flex items-center">
                                            <i className="ri-information-line mr-1.5"></i>
                                            Total stock across all variants: <strong className="ml-1">{variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)}</strong>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {variantCombinations.length === 0 && (
                                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    <i className="ri-layout-grid-line text-4xl text-gray-300 mb-3 block"></i>
                                    <p className="font-semibold text-gray-700">No variants configured</p>
                                    <p className="text-sm mt-1">Select colors and/or sizes above to create variant combinations.</p>
                                    <p className="text-xs mt-2 text-gray-400">You can add just colors, just sizes, or both for a full grid.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'images' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Product Images</h3>
                                <p className="text-gray-600">Add product images. The first image will be the primary image.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((img: any, index: number) => {
                                    return (
                                        <div key={index} className="relative group">
                                            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                                                <img src={img.url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="absolute top-2 left-2 flex gap-1">
                                                {index === 0 && (
                                                    <span className="bg-primary text-white px-2 py-1 rounded text-xs font-semibold">Primary</span>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-xl">
                                                <a href={img.url} target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                                    <i className="ri-eye-line"></i>
                                                </a>
                                                <button
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="w-9 h-9 flex items-center justify-center bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                                >
                                                    <i className="ri-delete-bin-line"></i>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                <label className={`aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center space-y-2 text-gray-600 hover:text-gray-900 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {uploading ? (
                                        <i className="ri-loader-4-line animate-spin text-3xl"></i>
                                    ) : (
                                        <i className="ri-add-circle-line text-3xl"></i>
                                    )}
                                    <span className="text-sm font-semibold text-center px-2">{uploading ? 'Uploading...' : 'Add Image'}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>

                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-700">
                                    <strong>Images:</strong> JPG, PNG, WebP — min 1000×1000px recommended.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seo' && (() => {
                        const effectiveTitle = seoTitle || productName || '';
                        const effectiveDesc = metaDescription || (description ? description.slice(0, 160) : '');
                        const effectiveSlug = urlSlug || generateSlug(productName || 'product');
                        const titleLen = effectiveTitle.length;
                        const descLen = effectiveDesc.length;

                        return (
                        <div className="space-y-6 max-w-3xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Search Engine Optimization</h3>
                                    <p className="text-gray-600">Optimize how this product appears in search results</p>
                                </div>
                                {productName && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!seoTitle) setSeoTitle(productName + " | Badawia's Imports");
                                            if (!metaDescription && description) setMetaDescription(description.slice(0, 160));
                                            if (!keywords) {
                                                const autoKeywords = productName.split(/\s+/).filter((w: string) => w.length > 2).join(', ');
                                                setKeywords(autoKeywords);
                                            }
                                        }}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <i className="ri-magic-line"></i>
                                        Auto-fill
                                    </button>
                                )}
                            </div>

                            {/* Google Preview */}
                            <div className="rounded-xl border border-gray-200 bg-white p-5">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Search Preview</p>
                                <div className="space-y-1">
                                    <p className="text-lg text-blue-700 font-medium leading-snug truncate hover:underline cursor-default">
                                        {effectiveTitle || 'Product Title'}
                                    </p>
                                    <p className="text-sm text-green-700 truncate">
                                        badawiasimports.com/product/{effectiveSlug}
                                    </p>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {effectiveDesc || 'Add a meta description to control how this product appears in search engine results.'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-gray-900">
                                        Page Title
                                    </label>
                                    <span className={`text-xs font-medium ${titleLen > 60 ? 'text-red-500' : titleLen > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {titleLen}/60
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={seoTitle}
                                    onChange={(e) => setSeoTitle(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                                    placeholder={productName ? `${productName} | Badawia's Imports` : 'Enter a page title'}
                                />
                                {titleLen > 60 && (
                                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                                        <i className="ri-alert-line"></i>
                                        Title may be truncated in search results. Keep it under 60 characters.
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-gray-900">
                                        Meta Description
                                    </label>
                                    <span className={`text-xs font-medium ${descLen > 160 ? 'text-red-500' : descLen > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {descLen}/160
                                    </span>
                                </div>
                                <textarea
                                    rows={3}
                                    value={metaDescription}
                                    onChange={(e) => setMetaDescription(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 resize-none"
                                    placeholder={description ? description.slice(0, 100) + '...' : 'Brief description for search engines'}
                                />
                                {descLen > 160 && (
                                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                                        <i className="ri-alert-line"></i>
                                        Description may be truncated. Keep it under 160 characters for best results.
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-gray-900">
                                        URL Slug
                                    </label>
                                    {slugManuallyEdited && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSlugManuallyEdited(false);
                                                setUrlSlug(generateSlug(productName || ''));
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer flex items-center gap-1"
                                        >
                                            <i className="ri-refresh-line"></i>
                                            Reset to auto
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center">
                                    <span className="text-gray-500 bg-gray-100 px-4 py-3 border-2 border-r-0 border-gray-300 rounded-l-lg text-sm whitespace-nowrap">
                                        badawiasimports.com/product/
                                    </span>
                                    <input
                                        type="text"
                                        value={urlSlug}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                                            setUrlSlug(sanitized);
                                            setSlugManuallyEdited(true);
                                        }}
                                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 font-mono text-sm"
                                        placeholder="product-slug"
                                    />
                                </div>
                                {!slugManuallyEdited && (
                                    <p className="text-xs text-gray-400 mt-1.5">Auto-generated from product name. Edit to customize.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Keywords / Tags
                                </label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                                    placeholder="handbag, leather, luxury, Ghana"
                                />
                                <p className="text-sm text-gray-500 mt-1.5">Separate keywords with commas — helps with search and filtering</p>
                            </div>
                        </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}

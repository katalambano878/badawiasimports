import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db/admin';

// Simple in-memory cache keyed by query string
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'new';
  const slim = searchParams.get('slim') !== '0';

  const cacheKey = `${featured}|${limit}|${page}|${category || ''}|${search || ''}|${sort}|${slim}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.timestamp < CACHE_TTL) {
    return NextResponse.json(hit.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    // Slim select: one image embed (ordered by position) + light variant fields
    const select = slim
      ? `
        id, name, slug, price, sale_price, compare_at_price, quantity, moq,
        rating_avg, review_count, featured, brand, vendor, metadata, created_at,
        categories(id, name, slug, parent_id),
        product_images(url, position),
        product_variants(id, name, price, quantity, option1, option2, image_url)
      `
      : `
        id, name, slug, price, sale_price, compare_at_price, quantity, description, metadata, brand, vendor, moq, featured, rating_avg, review_count, created_at,
        categories(id, name, slug, parent_id),
        product_images(url, position),
        product_variants(id, name, price, quantity, option1, option2, image_url)
      `;

    let query = dbAdmin
      .from('products')
      .select(select, { count: 'exact' })
      .eq('status', 'active');

    if (featured) {
      query = query.eq('featured', true);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (category && category !== 'all') {
      const { data: cat } = await dbAdmin
        .from('categories')
        .select('id')
        .eq('slug', category)
        .maybeSingle();
      if (cat?.id) {
        query = query.eq('category_id', cat.id);
      }
    }

    switch (sort) {
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating_avg', { ascending: false });
        break;
      case 'popular':
      case 'new':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Storefront API] Products error:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Keep only first image per product (sorted by position in compat layer)
    const trimmed = (data || []).map((p: Record<string, unknown>) => {
      const images = Array.isArray(p.product_images) ? p.product_images : [];
      const sorted = [...images].sort(
        (a: any, b: any) => (a?.position ?? 0) - (b?.position ?? 0)
      );
      return {
        ...p,
        product_images: sorted.slice(0, 1),
      };
    });

    const payload = { products: trimmed, count: count ?? trimmed.length, page, limit };
    cache.set(cacheKey, { data: payload, timestamp: Date.now() });

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
        'X-Cache': 'MISS',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    console.error('[Storefront API] Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

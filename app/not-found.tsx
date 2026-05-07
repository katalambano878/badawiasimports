import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-white">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1ABCDF] mb-4">Error 404</p>
      <h1 className="text-6xl md:text-8xl font-bold text-[#0D1B45]">404</h1>
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
      <p className="mt-3 text-gray-500 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-[#0D1B45] text-white rounded-full text-sm font-semibold hover:bg-[#0D1B45]/90 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/shop"
          className="px-6 py-3 border border-[#0D1B45] text-[#0D1B45] rounded-full text-sm font-semibold hover:bg-[#0D1B45]/5 transition-colors"
        >
          Browse Shop
        </Link>
      </div>
    </div>
  );
}

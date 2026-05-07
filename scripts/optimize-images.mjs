// Image optimization script for public/ folder.
// - Re-encodes PNG/JPG with sharp (smaller, same dimensions for icons; downscales hero photos)
// - Generates WebP + AVIF siblings for browsers that support them
// - Skips favicons, app icons, and SVG/ICO files
//
// Run with: node scripts/optimize-images.mjs
// Re-run safe: skips files that have a fresher .webp/.avif sibling.

import { readdir, stat, copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = 'public';
const BACKUP_DIR = 'public/.originals';

// Files we should NEVER touch (favicons, app icons, manifest assets).
const SKIP = new Set([
  'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png',
  'apple-touch-icon.png', 'icon-192x192.png', 'icon-512x512.png',
]);

// Hero / large photos — downscale to max width 1920 if larger.
const isHeroOrLarge = (name) =>
  /^hero-|^home-slide-|^og-image|ceo-portrait|logo\.png/i.test(name);

const ext = (p) => extname(p).toLowerCase();
const isImage = (p) => ['.png', '.jpg', '.jpeg'].includes(ext(p));

let totalSaved = 0;
let processed = 0;
let skipped = 0;

async function ensureBackup(filePath) {
  const rel = filePath.replace(/^public[\\/]/, '');
  const target = join(BACKUP_DIR, rel);
  if (existsSync(target)) return;
  await mkdir(dirname(target), { recursive: true });
  await copyFile(filePath, target);
}

async function optimizeOne(filePath) {
  const name = basename(filePath);
  if (SKIP.has(name)) {
    skipped++;
    return;
  }
  if (!isImage(filePath)) return;

  const originalStat = await stat(filePath);
  const originalSize = originalStat.size;

  // Backup before overwriting.
  await ensureBackup(filePath);

  let pipeline = sharp(filePath, { failOn: 'none' });
  const meta = await pipeline.metadata();

  // Downscale very large images (preserve aspect ratio).
  if (isHeroOrLarge(name) && meta.width && meta.width > 1920) {
    pipeline = pipeline.resize({ width: 1920, withoutEnlargement: true });
  }

  // Re-encode original format with smarter compression.
  // Important: only keep the new file if it's actually smaller — many small PNGs
  // are already optimal and re-encoding them with palette quantization makes
  // them BIGGER. We always generate WebP/AVIF siblings regardless.
  const originalExt = ext(filePath);
  const tmp = filePath + '.tmp';
  if (originalExt === '.png') {
    await pipeline
      .png({ quality: 80, compressionLevel: 9, palette: true, effort: 10 })
      .toFile(tmp);
  } else {
    await pipeline
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(tmp);
  }

  const tmpStat = await stat(tmp);
  const { rename, unlink } = await import('node:fs/promises');
  if (tmpStat.size < originalSize) {
    await unlink(filePath);
    await rename(tmp, filePath);
  } else {
    // New version is bigger — discard it and keep the original.
    await unlink(tmp);
  }

  // Generate WebP sibling.
  const webpPath = filePath.replace(/\.(png|jpe?g)$/i, '.webp');
  await sharp(filePath).webp({ quality: 80, effort: 5 }).toFile(webpPath);

  // Generate AVIF sibling (best compression, slowest encode).
  const avifPath = filePath.replace(/\.(png|jpe?g)$/i, '.avif');
  await sharp(filePath).avif({ quality: 60, effort: 4 }).toFile(avifPath);

  const newStat = await stat(filePath);
  const webpStat = await stat(webpPath);
  const avifStat = await stat(avifPath);

  const saved = originalSize - newStat.size;
  totalSaved += saved;
  processed++;

  console.log(
    `  ${name.padEnd(28)} ` +
    `${(originalSize / 1024).toFixed(1).padStart(7)} KB  →  ` +
    `PNG ${(newStat.size / 1024).toFixed(1).padStart(6)} KB | ` +
    `WebP ${(webpStat.size / 1024).toFixed(1).padStart(6)} KB | ` +
    `AVIF ${(avifStat.size / 1024).toFixed(1).padStart(6)} KB`
  );
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue; // skip dotfolders incl. .originals
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full);
    else await optimizeOne(full);
  }
}

(async () => {
  console.log('\nOptimizing images in public/ ...\n');
  await mkdir(BACKUP_DIR, { recursive: true });
  await walk(PUBLIC_DIR);
  console.log(`\nDone. Processed ${processed} | Skipped ${skipped}`);
  console.log(`Total saved (originals → optimized): ${(totalSaved / 1024).toFixed(1)} KB`);
  console.log(`Originals backed up to ${BACKUP_DIR}/\n`);
})().catch(err => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});

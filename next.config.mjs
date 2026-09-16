import { fileURLToPath } from 'node:url';
// Launcher-only measurement builds (scripts/local-server.mjs --compiled --measure) use a fixed,
// repo-contained output directory so they never overwrite the gate (.next) or preview build.
const MEASURE_DIST_DIRS = ['.next-measure', '.next-measure-analytics'];
const measureDistDir = process.env.FSC_DIST_DIR || '';
if (measureDistDir && (!MEASURE_DIST_DIRS.includes(measureDistDir) || process.env.FSC_LOCAL_PREVIEW === '1')) {
  throw new Error('FSC_DIST_DIR must be a measurement build directory and cannot be combined with local preview');
}
/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  distDir: measureDistDir || (process.env.FSC_LOCAL_PREVIEW === '1' ? '.fsc-local/build' : '.next'),
  // Every non-empty user agent gets blocking (non-streamed) metadata, so dynamically rendered
  // routes such as /contact keep title/description/canonical in <head>. Static prerendered HTML
  // is unaffected (export always renders with streaming metadata resolved at build time).
  htmlLimitedBots: /.*/,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;

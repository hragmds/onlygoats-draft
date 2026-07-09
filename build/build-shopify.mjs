import { build } from 'esbuild';

await build({
  entryPoints: ['src/hero/shopify-entry.js'],
  bundle: true,
  format: 'iife',
  globalName: 'OGHero',
  minify: true,
  target: ['es2019'],
  outfile: 'shopify/assets/og-hero.min.js',
});
console.log('built shopify/assets/og-hero.min.js');

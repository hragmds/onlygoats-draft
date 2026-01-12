// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'hragmds.github.io',
  base: '/onlygoats-draft',
  vite: {
    ssr: {
      external: ['three']
    }
  }
});

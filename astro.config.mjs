import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://barrie.netlify.app',
  output: 'static',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/photos') && !page.includes('/tools'),
    }),
  ],
});

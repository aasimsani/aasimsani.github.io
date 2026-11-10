import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://aasimsani.net',
  integrations: [mdx(), sitemap()],
  // Each page's CSS is under 10 kB compressed, so it rides inside the HTML and
  // the first paint doesn't wait on separate stylesheet requests.
  build: {
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

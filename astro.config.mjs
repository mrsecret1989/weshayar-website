import { defineConfig } from 'astro/config';
export default defineConfig({ site: 'https://pelepit.com', output: 'static', compressHTML: true, build: { inlineStylesheets: 'always' } });

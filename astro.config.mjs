// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import pagefind from './src/integrations/pagefind.mjs';
import { SITE } from './src/data/site.mjs';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages 用户站点，部署在域名根路径
  site: SITE.url,
  trailingSlash: 'ignore',

  integrations: [sitemap(), pagefind()],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    // 代码高亮：双主题，跟随深色/浅色切换
    // Shiki 会同时输出 --shiki-light / --shiki-dark 两套变量，
    // 由 global.css 里的 .dark 规则决定用哪一套，切换主题无需重新渲染。
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: false,
    },
    // 注：Astro 7 起默认的 Sätteri 处理器已内置 GFM 和智能标点，
    // 不再需要 remarkRehype / smartypants 配置。
  },

  build: {
    inlineStylesheets: 'auto',
  },
});

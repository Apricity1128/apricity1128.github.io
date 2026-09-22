// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import pagefind from './src/integrations/pagefind.mjs';
import lineNumbers from './src/plugins/shiki-line-numbers.mjs';
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
      // 给代码块加行号，见 src/plugins/shiki-line-numbers.mjs
      transformers: [lineNumbers()],
    },

    // 注 1：Astro 7 的默认 Markdown 处理器是 Sätteri（Rust 实现），
    // 内置 GFM 和智能标点，旧的 remarkRehype / smartypants 配置已不再支持。
    //
    // 注 2：数学公式**不在这里配置**。Sätteri 虽然内置 features.math，
    // 但实测无法通过 markdown.processor 干预（配置传进去也不生效），
    // 所以公式改由 src/utils/math.mjs 在正文进入渲染管线前预处理成 KaTeX HTML。
  },

  build: {
    inlineStylesheets: 'auto',
  },
});

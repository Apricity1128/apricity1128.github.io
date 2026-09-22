import rss from '@astrojs/rss';
import { getSortedPosts, excerptFrom } from '../utils/posts.js';
import { SITE } from '../data/site.mjs';

/**
 * RSS 订阅源 —— /rss.xml
 *
 * 注意：页面端点用 .js 时不能像 .astro 那样以 `---` 开头写 frontmatter，
 * 那三横线会被当成代码里的减号解析。注释统一放在 import 之后。
 */
export async function GET(context) {
  const posts = await getSortedPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description || excerptFrom(post.body ?? '', 200),
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
      author: SITE.author.name,
    })),
    customData: `<language>${SITE.lang}</language>`,
  });
}

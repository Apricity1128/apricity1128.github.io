/**
 * 通用工具函数
 */
import { getCollection } from 'astro:content';

/**
 * 读取所有已发布文章，按「置顶 → 日期倒序」排好。
 */
export async function getSortedPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return posts.sort((a, b) => {
    if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  });
}

/**
 * 统计所有标签及每个标签下的文章数，按数量倒序。
 * @returns {Promise<Array<{ tag: string, count: number }>>}
 */
export async function getTagCounts() {
  const posts = await getSortedPosts();
  const counts = new Map();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'));
}

/**
 * 把标签转成 URL 片段。
 *
 * 这里**不做** encodeURIComponent：Astro 生成动态路由时会自己对非 ASCII
 * 参数做百分号编码，再手动编一层会导致 getStaticPaths 的路径和实际请求
 * 的路径对不上（表现为 NoMatchingStaticPathFound）。
 * getStaticPaths 收到的 params.tag 是解码后的原值，可直接用来过滤。
 */
export function tagToSlug(tag) {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

/** 格式化日期为 2026 年 2 月 5 日 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** 格式化日期为 2026-02-05（给 datetime 属性用） */
export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

/** 格式化日期为 2 月 5 日 */
export function formatDateShort(date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * 估算阅读时长（中英文混排）。
 * 中文按 350 字/分钟，英文按 200 词/分钟。
 */
export function readingTime(body = '') {
  const cjk = (body.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = (body.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  const minutes = Math.ceil(cjk / 350 + words / 200);
  return Math.max(1, minutes);
}

/**
 * 取文章开头一段作为摘要，去掉 Markdown 语法。
 */
export function excerptFrom(body = '', length = 120) {
  const text = body
    .replace(/```[\s\S]*?```/g, '')       // 代码块
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接保留文字
    .replace(/^#{1,6}\s+/gm, '')          // 标题井号
    .replace(/[*_`>~-]/g, '')             // 强调等符号
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > length ? `${text.slice(0, length)}…` : text;
}

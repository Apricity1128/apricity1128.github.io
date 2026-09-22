import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 文章集合：src/content/blog/*.md
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    /** 摘要：显示在列表页和 SEO 描述里 */
    description: z.string().default(''),
    /** 发布日期 */
    pubDate: z.coerce.date(),
    /** 更新日期（可选） */
    updatedDate: z.coerce.date().optional(),
    /** 标签 */
    tags: z.array(z.string()).default([]),
    /** 草稿：true 则不会出现在任何列表和构建产物里 */
    draft: z.boolean().default(false),
    /** 置顶：在列表页排在最前 */
    pinned: z.boolean().default(false),
    /** 封面图（可选），相对 public/ 的路径 */
    cover: z.string().optional(),
    /** 语言，用于 <html lang> 和排序 */
    lang: z.string().default('zh-CN'),
  }),
});

export const collections = { blog };

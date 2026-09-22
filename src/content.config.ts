import { defineCollection, z } from 'astro:content';
import { postsLoader } from './loaders/posts-loader.mjs';

/**
 * 文章集合
 *
 * 正文放在项目根目录的 posts/ 下，写一个 .md 文件就是一篇新文章。
 * title / pubDate / description 这些都不用手写 —— 由 postsLoader 自动推导，
 * 见 src/loaders/posts-loader.mjs 顶部的说明。
 *
 * 这里所有字段都给了默认值，因此「只有正文、零 frontmatter」的文件也能通过校验。
 */
const blog = defineCollection({
  loader: postsLoader({ base: 'posts' }),
  schema: z.object({
    /** 自动推导：frontmatter → 正文第一个 # 标题 → 文件名 */
    title: z.string(),
    /** 自动推导：frontmatter → 正文前 160 字 */
    description: z.string().default(''),
    /** 自动推导：frontmatter → 文件名里的日期 → git 提交时间 → 文件修改时间 */
    pubDate: z.coerce.date(),
    /** 可选，手写会覆盖自动推导 */
    updatedDate: z.coerce.date().optional(),
    /** 标签，可以是数组或逗号分隔的字符串 */
    tags: z.array(z.string()).default([]),
    /** 草稿：true 则不出现在任何列表和构建产物里 */
    draft: z.boolean().default(false),
    /** 置顶 */
    pinned: z.boolean().default(false),
    /** 覆盖 URL，一般用不到 */
    slug: z.string().optional(),
    /** 封面图，相对 public/ 的路径 */
    cover: z.string().optional(),
    /** 语言 */
    lang: z.string().default('zh-CN'),
  }),
});

export const collections = { blog };

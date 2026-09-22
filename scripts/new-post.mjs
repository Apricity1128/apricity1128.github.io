#!/usr/bin/env node
/**
 * 新建文章脚本
 *
 *   npm run new "文章标题"
 *   npm run new "文章标题" -- --slug my-post --tags Astro,教程
 *
 * 会在 src/content/blog/ 下生成一个带好 frontmatter 的 Markdown 文件。
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = resolve(__dirname, '../src/content/blog');

/** 解析命令行参数 */
function parseArgs(argv) {
  const positional = [];
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

/** 把标题转成适合做文件名的 slug（保留中文，去掉标点） */
function slugify(input) {
  return (
    input
      .trim()
      .toLowerCase()
      // 去掉文件名不允许的字符
      .replace(/[\\/:*?"<>|]/g, '')
      // 空白转连字符
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `post-${Date.now()}`
  );
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const title = positional.join(' ').trim();

if (!title) {
  console.error(`
用法：
  npm run new "文章标题"
  npm run new "文章标题" -- --slug my-post --tags Astro,教程

可选参数：
  --slug <文件名>      指定文件名 slug（默认由标题生成）
  --tags a,b,c         标签，逗号分隔
  --description <文本>  文章摘要
`);
  process.exit(1);
}

const slug = flags.slug ? slugify(String(flags.slug)) : slugify(title);
const tags = flags.tags
  ? String(flags.tags)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  : [];
const description = flags.description ? String(flags.description) : '';

// 用本地日期，避免时区问题
const now = new Date();
const date = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
].join('-');

const filePath = join(BLOG_DIR, `${slug}.md`);

// 已存在就不覆盖
try {
  await access(filePath);
  console.error(`文件已存在，未覆盖：${filePath}`);
  process.exit(1);
} catch {
  /* 不存在，可以继续 */
}

const tagsLine = tags.length > 0 ? `\ntags: [${tags.map((t) => `"${t}"`).join(', ')}]` : '\ntags: []';

const content = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description}"
pubDate: ${date}${tagsLine}
draft: true
pinned: false
---

在这里写正文。

## 第一节

正文支持 **Markdown** 全部语法：

- 列表
- \`行内代码\`
- [链接](https://astro.build)

\`\`\`ts
// 代码块会自动高亮，并带上复制按钮
const hello = (name: string) => \`Hello, \${name}!\`;
\`\`\`

> 引用块也可以。

写完之后把 frontmatter 里的 \`draft: true\` 改成 \`false\`（或者删掉这一行），
文章就会出现在列表里了。
`;

await mkdir(BLOG_DIR, { recursive: true });
await writeFile(filePath, content, 'utf8');

console.log(`✅ 已创建：src/content/blog/${slug}.md`);
console.log(`   标题：${title}`);
if (tags.length > 0) console.log(`   标签：${tags.join(', ')}`);
console.log(`\n提示：目前 draft: true，写完后改成 false 才会发布。`);

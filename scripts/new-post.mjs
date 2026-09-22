#!/usr/bin/env node
/**
 * 新建文章（可选工具）
 *
 * 其实你完全可以不跑这个脚本 —— 直接在 posts/ 里新建一个 .md 文件写正文就行，
 * 标题和日期都会自动推导。这个脚本只是帮你把文件名和日期前缀规范化。
 *
 * 用法：
 *   npm run new "文章标题"
 *   npm run new "文章标题" -- --tags Astro,教程
 *   npm run new "文章标题" -- --no-date     # 文件名不带日期前缀
 *   npm run new "文章标题" -- --date 2026-01-01
 *
 * 生成的文件默认带 draft: true，写完把这一行删掉（或改成 false）才会发布。
 * 如果连 frontmatter 都不想要，把生成的 --- 块整个删掉也完全没问题。
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = resolve(__dirname, '../posts');

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

/** 把标题转成安全的文件名片段：去掉不能用于文件名的字符 */
function slugify(input) {
  return (
    input
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `post-${Date.now()}`
  );
}

function today() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const title = positional.join(' ').trim();

if (!title) {
  console.error(`
用法：
  npm run new "文章标题"
  npm run new "文章标题" -- --tags Astro,教程
  npm run new "文章标题" -- --no-date

可选参数：
  --tags a,b,c      标签，逗号分隔
  --date YYYY-MM-DD 指定文件名里的日期（默认今天）
  --no-date         文件名不带日期前缀
  --no-frontmatter  完全不生成 frontmatter，只留正文
`);
  process.exit(1);
}

const date = typeof flags.date === 'string' ? flags.date : today();
const stem = flags['no-date'] ? slugify(title) : `${date}-${slugify(title)}`;
const tags = flags.tags
  ? String(flags.tags)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  : [];

const filePath = join(POSTS_DIR, `${stem}.md`);

try {
  await access(filePath);
  console.error(`文件已存在，未覆盖：posts/${stem}.md`);
  process.exit(1);
} catch {
  /* 不存在，继续 */
}

const frontmatter = flags['no-frontmatter']
  ? ''
  : `---
${tags.length ? `tags: [${tags.map((t) => `"${t}"`).join(', ')}]\n` : ''}draft: true
---

`;

const content = `${frontmatter}# ${title}

在这里写正文。除了这一行标题，其他什么都不用管 —— 日期会自动取文件名或 git 提交时间。

## 第一节

正文支持 **Markdown** 全部语法：

- 列表
- \`行内代码\`
- [链接](https://astro.build)

\`\`\`js
// 代码块会自动高亮，并带上语言标签和复制按钮
const hello = (name) => \`Hello, \${name}!\`;
\`\`\`

> 引用块也可以。

写完之后，把 frontmatter 里的 \`draft: true\` 删掉（或者改成 \`false\`），
提交推送，网站就会自动更新。
`;

await mkdir(POSTS_DIR, { recursive: true });
await writeFile(filePath, content, 'utf8');

const hasFrontmatter = !flags['no-frontmatter'];
const slug = slugify(title);

console.log(`✅ 已创建：posts/${stem}.md`);
console.log(`   标题：${title}（将取自正文第一个 # 标题）`);
console.log(`   访问路径：/blog/${slug}/`);
if (tags.length > 0) console.log(`   标签：${tags.join(', ')}`);

if (hasFrontmatter) {
  console.log('\n提示：目前是草稿，写完后删掉 draft: true 这一行即可发布。');
} else {
  console.log('\n这个文件没有任何 frontmatter，提交推送后就会直接发布。');
}

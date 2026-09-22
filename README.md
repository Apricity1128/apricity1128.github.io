# Apricity

个人博客源码。基于 [Astro Theme Pure](https://github.com/cworld1/astro-theme-pure) 构建，
视觉与交互参考 [Arthals-Ink](https://github.com/zhuozhiyongde/Arthals-Ink)。

线上地址：**https://apricity1128.github.io**

---

## 特性

| 功能 | 说明 |
| --- | --- |
| 灵动岛导航 | 滚动时顶部导航收缩为悬浮圆角药丸（`packages/pure` 里的 Header Web Component） |
| 深色 / 浅色 | CSS 变量驱动，跟随系统，切换无闪烁 |
| 站内全文搜索 | [Pagefind](https://pagefind.app)，构建期生成索引 |
| 数学公式 | `$...$` 与 `$$...$$`，构建期用 [KaTeX](https://katex.org/) 渲染 |
| 代码高亮 | Shiki 双主题，带语言标签、复制按钮、长代码折叠 |
| 文章目录 | 右侧 TOC，滚动高亮 |
| 标签与归档 | `/tags`、`/archives` |
| RSS 与 Sitemap | `/rss.xml`、`/sitemap-index.xml` |
| 自动部署 | GitHub Actions，推送即发布 |

---

## 快速开始

```bash
npm install
npm run dev          # http://localhost:4321
```

> **注意**：本站的 URL **不带尾斜杠**（`trailingSlash: 'never'`），
> 所以文章地址是 `/blog/hello-world` 而不是 `/blog/hello-world/`。

其他命令：

```bash
npm run build        # 构建到 dist/（含 Pagefind 索引）
npm run preview      # 预览构建结果
npm run check        # 类型检查
npm run clean        # 清理 .astro 与 dist
```

---

## 写一篇文章

文章放在 `src/content/blog/`，文件名用英文短横线命名（不带日期）。

**frontmatter 是必填的**，至少要有这三个字段：

```markdown
---
title: 文章标题
publishDate: 2026-02-05
description: 一句话摘要，会显示在列表页和 SEO 里
---

正文从这里开始。
```

可选字段：

```markdown
---
title: 文章标题
publishDate: 2026-02-05
updatedDate: 2026-02-10        # 最后更新日期
description: 一句话摘要
tags: [算法, 题解]              # 标签（会自动转小写）
language: 中文                  # 文章语言
draft: false                   # true 则不发布
heroImage:                     # 封面图
  src: ./cover.png
  alt: 封面
  color: '#659EB9'             # 首页渐变高亮色
---
```

### 数学公式

```markdown
行内：当 $n \to \infty$ 时收敛。

行间（前后留空行）：

$$
\sum_{i=1}^{n} \binom{n}{i} = 2^n
$$
```

---

## 改站点内容

| 想改什么 | 改哪里 |
| --- | --- |
| 站名、作者、简介、头像、导航、页脚、社交链接 | `src/site.config.ts` |
| 首页（个人介绍、教育经历、技能） | `src/pages/index.astro` |
| 关于页 | `src/pages/about/index.astro` |
| 项目页 | `src/pages/projects/index.astro` |
| 友链列表 | `public/links.json` |
| 主题色、字体、全局样式 | `src/assets/styles/app.css`、`global.css` |
| 文章排版（prose） | `src/site.config.ts` 的 `integ.typography` |

**换头像**：替换 `src/assets/avatar.jpg`（首页与关于页共用）。

**换社交卡片**：替换 `public/images/social-card.png`（分享到社交平台时的预览图）。

---

## 目录结构

```
.
├── src/
│   ├── assets/
│   │   ├── avatar.jpg             # 头像
│   │   └── styles/                # app.css（主题）与 global.css（排版）
│   ├── components/                # 自定义组件（Signature、ProjectSection…）
│   ├── content/blog/              # ⬅ 文章都在这里
│   ├── layouts/                   # BaseLayout / BlogPost / ContentLayout…
│   ├── pages/                     # 路由：/、/blog、/about、/projects、/links…
│   ├── plugins/                   # Shiki transformer、rehype 插件
│   └── site.config.ts             # ⬅ 站点配置总入口
├── packages/pure/components/basic/Footer.astro   # 本地覆盖的页脚组件
├── public/                        # 静态资源（favicon、图片、links.json）
├── scripts/                       # 一次性脚本（资源生成、文章迁移等）
└── astro.config.ts                # Astro 配置
```

---

## 部署

推送到 `main` 即自动部署（`.github/workflows/deploy.yml`）：

```
push → npm ci → npm run build（含 Pagefind 索引）→ 上传 dist/ → 发布到 Pages
```

仓库的 **Settings → Pages → Source** 需要选择 **GitHub Actions**。

---

## 与上游的差异

本项目 fork 自 Arthals-Ink，做了以下改动：

- **移除评论系统**：`src/components/waline` 下的组件改成了空实现，
  不再引入 `@waline/client`（省掉 1MB+ 前端依赖）。
  `site.config.ts` 里保留 `waline` 字段是因为 astro-pure 的 schema 要求它存在。
- **移除访问统计**：去掉了原作者接入的 Umami 与 Google Analytics。
- **移除好友圈**：`/links` 里的 Friend-Circle-Lite 指向作者自己的服务器，已注释掉。
- **改用 npm**：原仓库用 Bun，本机没有 Bun，改用 npm 并提交 `package-lock.json`。
- **内容全部替换**：文章、项目、友链、关于页均换成本站自己的内容。

---

## 已知限制

- **文章 frontmatter 必填**：`title`、`publishDate`、`description` 三个字段缺一个就构建失败。
  这是 Astro Theme Pure 的 content collection schema 决定的。
- **URL 不带尾斜杠**：沿用上游的 `trailingSlash: 'never'`。
  从带尾斜杠的旧链接访问会跳转。

---

## License

主题部分：[Apache-2.0](LICENSE)（Astro Theme Pure）。
本站的文章内容版权归作者所有。

# Apricity

我的个人博客源码 —— 基于 [Astro](https://astro.build) 构建，部署在 GitHub Pages。

线上地址：**https://apricity1128.github.io**

---

## 特性

| 功能 | 实现 |
| --- | --- |
| 深色 / 浅色主题 | CSS 变量 + `.dark` 类，首屏内联脚本防白闪，跟随系统偏好 |
| 站内全文搜索 | [Pagefind](https://pagefind.app)，构建期生成索引，纯静态无需服务端 |
| 文章目录（TOC） | 从 Markdown 标题自动提取，滚动时高亮当前小节 |
| 代码高亮 | Shiki 双主题，浅色/深色各一套配色，带语言标签和复制按钮 |
| 标签分类 | frontmatter 里的 `tags`，自动生成标签页 |
| RSS 订阅 | `/rss.xml` |
| 站点地图 | `/sitemap-index.xml` |
| 自动部署 | GitHub Actions，推送即发布 |

---

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器 → http://localhost:4321
```

> ⚠️ 开发模式下**站内搜索不可用**：Pagefind 的索引是在构建后扫描 `dist/` 生成的。
> 要测试搜索，请用构建预览：
>
> ```bash
> npm run build && npm run preview
> ```

其他命令：

```bash
npm run build    # 构建到 dist/（含 Pagefind 索引）
npm run preview  # 预览构建结果
npm run check    # Astro 类型检查
```

---

## 写一篇新文章

**方式一：用脚本生成（推荐）**

```bash
npm run new "文章标题"
npm run new "文章标题" -- --tags Astro,教程 --description "一句话摘要"
```

会在 `src/content/blog/` 下生成一个带好 frontmatter 的 `.md` 文件，
默认 `draft: true`，写完把这一行改成 `false`（或删掉）就会发布。

**方式二：手动新建**

在 `src/content/blog/` 里新建 `my-post.md`：

```markdown
---
title: "文章标题"
description: "摘要，显示在列表页和搜索引擎结果里"
pubDate: 2026-02-08
updatedDate: 2026-02-10   # 可选
tags: ["Astro", "教程"]
draft: false              # true 则不发布
pinned: false             # true 则置顶
---

正文从这里开始，用 Markdown 写。
```

文件名（不含 `.md`）就是文章的 URL：`my-post.md` → `/blog/my-post/`。

---

## 改站点内容

| 想改什么 | 改哪里 |
| --- | --- |
| 站名、简介、头像、社交链接、技能、经历 | `src/data/site.mjs` |
| 项目列表 | `src/data/projects.json` |
| 友链 | `src/data/links.json` |
| 首页「关于」段落 | `src/data/site.mjs` 里的 `about` |
| 主题色、字体、排版 | `src/styles/global.css` 顶部的设计令牌 |
| 导航菜单 | `src/data/site.mjs` 里的 `nav` |

头像替换：把自己的图片放进 `public/`（例如 `public/avatar.png`），
然后改 `src/data/site.mjs` 里的 `author.avatar`。

---

## 目录结构

```
.
├── .github/workflows/deploy.yml   # GitHub Actions 自动部署
├── public/                        # 静态资源，原样复制到 dist/
│   ├── avatar.svg                 # 头像
│   └── favicon.svg                # 站点图标
├── scripts/
│   ├── new-post.mjs               # npm run new 的实现
│   └── dev/                       # 本地视觉验证辅助脚本（不提交）
├── src/
│   ├── components/                # Header / Footer / PostCard / TOC / Icon …
│   ├── content/blog/              # ⬅ 文章 Markdown 都在这里
│   ├── data/                      # 站点配置、项目、友链（纯数据）
│   ├── integrations/pagefind.mjs  # 构建后自动生成搜索索引
│   ├── layouts/BaseLayout.astro   # 全站 HTML 骨架
│   ├── pages/                     # 路由（文件路径 = URL）
│   │   ├── index.astro            # /
│   │   ├── blog/index.astro       # /blog
│   │   ├── blog/[id].astro        # /blog/<文章>
│   │   ├── tags/                  # /tags 与 /tags/<标签>
│   │   ├── search.astro           # /search
│   │   ├── about.astro            # /about
│   │   ├── projects.astro         # /projects
│   │   ├── links.astro            # /links
│   │   ├── 404.astro              # 404 页面
│   │   └── rss.xml.js             # /rss.xml
│   ├── styles/global.css          # 设计令牌 + 排版 + 组件样式
│   ├── utils/posts.js             # 读取/排序/格式化文章的工具函数
│   └── content.config.ts          # 文章 frontmatter 的字段校验
└── astro.config.mjs               # Astro 配置
```

---

## 部署

推送到 `main` 分支后，GitHub Actions 会自动构建并发布：

```
push → 安装依赖 → astro build（含 Pagefind 索引）→ 上传 dist/ → 发布到 Pages
```

仓库的 **Settings → Pages → Source** 需要选择 **GitHub Actions**（只需设置一次）。

工作流文件：`.github/workflows/deploy.yml`

发布地址：https://apricity1128.github.io

---

## 技术说明

几个容易踩坑、已在代码里注释的点：

- **Astro 7 的 Markdown 处理器**默认是 Sätteri，内置 GFM 和智能标点，
  旧的 `remarkRehype` / `smartypants` 配置已不再支持。
- **Pagefind 必须构建后才能用**，所以集成挂在 `astro:build:done` 钩子上，
  不需要在 npm scripts 里再串一条命令。
- **搜索页的动态 import 不能用字面量写法**：Vite 会把它改写成
  `__VITE_PRELOAD__` 形式，而 Astro 的内联脚本运行时没有这个全局变量。
  代码里用 `new Function` 在运行时拼 import 表达式绕开打包器。
- **中文标签的路由**不要手动 `encodeURIComponent`：Astro 生成动态路由时
  会自己编码，手动再编一层会导致路径匹配不上。
- **代码块双主题**依赖 Shiki 输出的内联 `color` 与 `--shiki-dark` 变量，
  深色覆盖必须用 `!important` 才能压过内联样式。

---

## License

源码可自由参考使用。文章内容版权归作者所有。

# Apricity

我的个人博客源码 —— 基于 [Astro](https://astro.build) 构建，部署在 GitHub Pages。

线上地址：**https://apricity1128.github.io**

---

## 特性

| 功能 | 实现 |
| --- | --- |
| 丢 md 就发布 | 标题/日期/摘要/URL 全自动推导，零配置（见 `src/loaders/posts-loader.mjs`） |
| 深色 / 浅色主题 | CSS 变量 + `.dark` 类，首屏内联脚本防白闪，跟随系统偏好 |
| 站内全文搜索 | [Pagefind](https://pagefind.app)，构建期生成索引，纯静态无需服务端 |
| 文章目录（TOC） | 从 Markdown 标题自动提取，滚动时高亮当前小节 |
| 代码高亮 | Shiki 双主题，浅色/深色各一套配色，带语言标签和复制按钮 |
| 数学公式 | 支持 `$...$` 与 `$$...$$`，构建期用 KaTeX 渲染 |
| 标签分类 | `tags` 字段，自动生成标签页 |
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

**最省事的方式：直接丢一个 `.md` 文件进 `posts/` 文件夹，只写正文就行。**

标题、日期、摘要、URL 全部自动推导，不需要写任何配置：

```bash
posts/2026-02-05-我的第一篇文章.md
```

```markdown
# 我的第一篇文章

正文随便写。标题取自这一行，日期取自文件名，URL 变成 /blog/我的第一篇文章/。
```

提交推送，网站自动更新。就这样。

### 三种写法，挑一种顺手的

| 写法 | 文件名 | 日期来自 | 说明 |
| --- | --- | --- | --- |
| 带日期（推荐） | `2026-02-05-标题.md` | 文件名 | 最稳，日期由你完全掌控 |
| 不带日期 | `标题.md` | git 首次提交时间 | 省事，日期自动记录 |
| 完整配置 | 任意 | frontmatter | 需要标签、置顶、摘要时用 |

### 各字段的自动推导规则

**全都可以不写**，需要覆盖时才写 frontmatter：

| 字段 | 自动来源（按优先级） |
| --- | --- |
| `title` | frontmatter → 正文第一个 `#` 标题 → 文件名 |
| `pubDate` | frontmatter → 文件名里的日期 → git 提交时间 → 文件修改时间 |
| `updatedDate` | frontmatter → git 最近一次提交时间 |
| `description` | frontmatter → 正文前 160 字 |
| URL | frontmatter 的 `slug` → 文件名（自动去掉日期前缀） |
| `tags` | 只能手写，支持 `tags: [a, b]` 或 `tags: a, b` |

> **关于日期为什么用 git 提交时间**：如果用文件系统修改时间，CI 每次全新检出后
> 所有文件的 mtime 都会变成构建那一刻，老文章的日期会全部漂移到部署当天。
> git 提交时间存在 git 对象里，换机器、重新克隆都不会变，所以是稳定的。
> 这也是推荐在文件名里写日期的原因 —— 最直观，且完全不依赖 git。

### 需要标签、置顶时

文件名 `posts/2026-02-05-我的文章.md`，内容：

```markdown
---
tags: [Astro, 教程]
pinned: true
draft: false
description: 这句会覆盖自动提取的摘要
---

# 我的文章

正文……
```

`draft: true` 时文章不会出现在任何列表和构建产物里。

### 用脚本生成（可选）

```bash
npm run new "文章标题"
npm run new "文章标题" -- --tags Astro,教程
npm run new "文章标题" -- --no-date          # 文件名不带日期
npm run new "文章标题" -- --no-frontmatter   # 完全不要 frontmatter
```

### 在 GitHub 网页上写

不用装任何东西：仓库里进 `posts/` → **Add file** → **Create new file** →
文件名写 `2026-02-05-标题.md` → 粘贴正文 → **Commit changes**。
一分钟左右网站就会更新。

### 写数学公式

直接写 LaTeX，用 `$` 包裹即可，构建时会渲染成 KaTeX：

```markdown
行内公式：当 $n \to \infty$ 时收敛。

行间公式（前后各留一个空行）：

$$
\sum_{i=1}^{n} \binom{n}{i} = 2^n
$$
```

- `$...$` 行内公式，`$$...$$` 行间公式
- 代码块和行内代码里的 `$` 不会被当成公式
- 想输出字面量美元符号，用 `\$` 转义
- 公式写错不会让构建失败，页面上会以原始文本显示，方便你发现

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
├── posts/                         # ⬅ 文章都在这里，丢 md 进来就发布
│   ├── 2026-02-05-hello-world.md
│   └── 2026-02-08-markdown-guide.md
├── .github/workflows/deploy.yml   # GitHub Actions 自动部署
├── public/                        # 静态资源，原样复制到 dist/
│   ├── avatar.svg                 # 头像
│   ├── favicon.svg                # 站点图标
│   └── images/                    # 文章里引用的图片放这里
├── scripts/
│   ├── new-post.mjs               # npm run new 的实现（可选工具）
│   └── dev/                       # 本地视觉验证辅助脚本（不提交）
├── src/
│   ├── components/                # Header / Footer / PostCard / TOC / Icon …
│   ├── data/                      # 站点配置、项目、友链（纯数据）
│   ├── integrations/pagefind.mjs  # 构建后自动生成搜索索引
│   ├── layouts/BaseLayout.astro   # 全站 HTML 骨架
│   ├── loaders/posts-loader.mjs   # ⬅ 自动推导标题/日期/摘要的核心逻辑
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
│   └── content.config.ts          # 文章字段定义（全部有默认值）
└── astro.config.mjs               # Astro 配置
```

> 文章目录在项目根目录的 `posts/`，不在 `src/` 里面 —— 这样打开项目第一眼就能看到它。

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

- **文章日期用 git 提交时间而非文件系统 mtime**：CI 每次全新 checkout 后
  所有文件的 mtime 都会变成构建那一刻，如果用 mtime，老文章的日期会集体漂移到
  部署当天。git 提交时间存在 git 对象里，重新克隆也不变。只有在没有 `.git`、
  或文件还没提交时，才回退到 mtime。
- **`posts/` 放在项目根目录而不是 `src/content/`**：加载器是自己写的
  （`src/loaders/posts-loader.mjs`），不依赖 Astro 的 `src/content` 约定，
  所以目录位置可以自由放，挑一个打开项目就能看见的位置。
- **frontmatter 解析失败要报错而不是静默忽略**：YAML 写错时如果静默当成无
  frontmatter，作者会以为标签丢了却找不到原因，所以加载器会直接抛出带说明的错误。
- **Astro 7 的 Markdown 处理器**默认是 Sätteri，内置 GFM 和智能标点，
  旧的 `remarkRehype` / `smartypants` 配置已不再支持。
- **数学公式为什么不用 rehype-katex 的常规接法**：Sätteri 虽然内置 `features.math`，
  但实测无法通过 `markdown.processor` 干预（配置传进去也不生效，公式会原样留下
  `$` 符号）。所以改成两步：先让 Astro 正常渲染 Markdown，再在产出的 HTML 上把
  `$...$` / `$$...$$` 换成 KaTeX。实现见 `src/utils/math.mjs`，其中会先摘出
  代码块再处理公式，避免代码里的 `$` 被误判。
- **自定义加载器必须自己产出 `rendered.html`**：`astro:content` 的 `render(entry)`
  在自定义加载器下读的是 `entry.rendered.html`，**不是** `entry.body`。只 set body、
  rendered 留空的话，页面上正文会整个消失（而且不报错，很难查）。
- **`store.set` 不要传 `digest`**：digest 相同时它会直接跳过写入，而 Astro 在两次
  加载之间会把 store 序列化再读回，`rendered`（渲染好的 HTML）在往返中会丢失 ——
  结果是第二次加载被跳过、正文消失。那套去重是给官方 glob loader 的增量渲染用的。
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

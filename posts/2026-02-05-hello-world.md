---
title: "你好，世界"
description: "这是本站的第一篇文章。聊聊为什么重新搭了这个博客，以及它是怎么建起来的。"
pubDate: 2026-02-05
tags: ["随笔", "Astro"]
pinned: true
---

欢迎来到我的新博客。🎉

这个站点是用 [Astro](https://astro.build) 重新搭建的，替代了我之前那个手写的纯 HTML 版本。趁这个机会，顺便说几句为什么写博客、以及这个站点的技术选择。

## 为什么又开始写博客

断断续续写过几次，每次都停在第三篇。复盘下来，之前失败的原因是**把写博客当成了一件需要"准备好"的事**——想着要写就得写点有价值的、成体系的。

后来想通了：博客的价值不在于篇篇精品，而在于**持续记录下来**。哪怕只是一段踩坑记录、一个刚想明白的小结论，攒上半年回头看，就是一份很有用的个人档案。

> 写作是最好的思考方式。你以为自己想清楚了，直到你试着把它讲给别人听。

所以这次的策略是：降低发布门槛，先写起来。格式不重要，长短不重要，写完就发。

## 技术选型

核心诉求只有三条：**写得快、加载快、不花钱**。

最终选了 Astro，理由很直接：

- **默认零 JavaScript**。博客以内容为主，不需要前端框架那一整套运行时。
- **Markdown 优先**。写文章就是新建一个 `.md` 文件，`git push` 之后就上线。
- **构建期渲染**。所有页面在构建时就生成好静态 HTML，访问速度就是静态文件的速度。
- **任何人都能看懂产物**。构建结果是一堆 HTML，没有黑盒。

代码高亮由 Shiki 在构建期完成，浅色和深色两套主题同时输出，切换主题时不用重新渲染：

```ts
// src/utils/posts.js 里的排序逻辑
export async function getSortedPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return posts.sort((a, b) => {
    // 置顶的排最前，其余按日期倒序
    if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  });
}
```

## 部署

托管用的是 GitHub Pages，配合 GitHub Actions 做自动构建。整个流程就是一次 `git push`：

```yaml
# .github/workflows/deploy.yml 节选
- name: 安装依赖
  run: npm ci

- name: 构建
  run: npm run build

- name: 部署到 GitHub Pages
  uses: actions/deploy-pages@v4
```

推上去之后等一分钟左右，网站就更新了。不需要自己买服务器，也不需要配 Nginx。

## 接下来写什么

目前大概想清楚几个方向：

1. **技术笔记**——主要是前端和工具链，踩过的坑优先写。
2. **阅读摘录**——读书时觉得值得记下来的段落和想法。
3. **随笔**——没有明确归属的零散思考。

具体写多少、写多久，说实话没底。但至少现在，把"开始"这件事完成了。

## 关于这个主题

如果你也想要一个类似的博客，本站的源码是开源的，可以直接 fork 走。主题特性包括：

| 特性 | 实现方式 |
| --- | --- |
| 深色 / 浅色切换 | CSS 变量 + `.dark` 类，首屏无闪烁 |
| 站内搜索 | Pagefind，构建期生成索引 |
| 文章目录 | 从 Markdown 标题自动提取 |
| 标签分类 | frontmatter 里的 `tags` 字段 |
| RSS 订阅 | `@astrojs/rss` |

就这样，开始写吧 🚀

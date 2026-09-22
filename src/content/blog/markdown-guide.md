---
title: "Markdown 写作速查"
description: "本站支持的全部 Markdown 语法示例，写文章时可以直接对照。"
pubDate: 2026-02-08
updatedDate: 2026-02-10
tags: ["Markdown", "教程"]
---

这篇是写作参考页，列出了本站支持的所有 Markdown 语法。忘了怎么写的时候回来翻一眼就行。

## 基础文本

普通段落直接写。**加粗**用两个星号，*斜体*用一个星号，~~删除线~~用两个波浪号，`行内代码`用反引号。

需要强制换行时，在行尾加两个空格。

## 标题层级

用 `##` 到 `####`。文章标题本身由 frontmatter 里的 `title` 决定，正文从 `##` 开始写就好。

四个井号以上就不建议用了，右侧目录只收录二级和三级标题。

### 三级标题长这样

#### 四级标题长这样

## 列表

无序列表：

- 第一项
- 第二项
  - 嵌套的子项
  - 另一个子项
- 第三项

有序列表：

1. 第一步
2. 第二步
3. 第三步

任务列表：

- [x] 已经做完的事
- [ ] 还没做的事

## 引用

> 单层引用。
>
> 引用里也可以有多个段落，还能放**其他格式**。

> 嵌套引用：
>
> > 第二层。

## 代码

行内代码：`const answer = 42`。

代码块要标注语言，这样高亮才准确：

```js
// JavaScript
function greet(name) {
  return `Hello, ${name}!`;
}
```

```python
# Python
def fib(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

```bash
# Shell
npm install
npm run build
npm run preview
```

```json
{
  "title": "配置示例",
  "draft": false,
  "tags": ["Markdown", "教程"]
}
```

## 表格

| 语法 | 效果 | 备注 |
| --- | --- | --- |
| `**粗体**` | **粗体** | |
| `*斜体*` | *斜体* | |
| `` `代码` `` | `代码` | 行内 |
| `[文字](url)` | [文字](https://astro.build) | 外链 |

表格太宽时，手机上会变成横向滚动，不会撑破布局。

## 链接与图片

普通链接：[Astro 官方文档](https://docs.astro.build)。

带标题的链接：[Astro](https://astro.build "Astro 官网")。

图片放在 `public/` 下，用绝对路径引用：

```md
![图片说明](/images/example.png)
```

## 分隔线

三个或更多短横线：

---

分隔线以上和以下是两段内容。

## Frontmatter

每篇文章开头的这一段是 frontmatter，用来给文章打标记：

```yaml
---
title: "文章标题"          # 必填
description: "摘要"        # 可选，显示在列表页和 SEO
pubDate: 2026-02-08       # 必填，发布日期
updatedDate: 2026-02-10   # 可选，最后更新日期
tags: ["标签一", "标签二"]  # 可选
draft: false              # 可选，true 则不发布
pinned: false             # 可选，true 则置顶
---
```

## 脚注

脚注语法也支持[^1]。

[^1]: 这是脚注的内容，会自动收集到文章末尾。

## 转义

需要显示字面量星号时用反斜杠转义：\*不是斜体\*。

## 小技巧

新建文章不用手写 frontmatter，用命令生成：

```bash
npm run new "文章标题" -- --tags 前端,工具
```

生成的文件默认是 `draft: true`，写完再改成 `false`。

/**
 * Shiki transformer：给代码块加行号
 *
 * 为什么用 transformer 而不是 CSS counter：
 * 一页上通常有好几个代码块，用 CSS counter 需要给每个块单独 counter-reset，
 * 而 Astro 的内置 transformer 会重写 <pre> 的 style 属性，很难可靠地注入。
 * 走 Shiki 的 line 钩子直接插入真实的行号节点，行为确定、也不依赖 counter 作用域。
 *
 * Astro 会把这里的 transformer 追加到 Shiki 自带的那组之后执行，
 * 所以 line 钩子拿到的已经是带 .line 类的行元素（见 @astrojs/internal-helpers 的 shiki.js）。
 */

/** 给代码块的每一行加上行号节点 */
export function lineNumbers() {
  return {
    name: 'line-numbers',
    line(node, line) {
      // 行号做成独立的 span，内容就是数字本身。
      // aria-hidden 让读屏软件跳过它；user-select:none 保证复制代码时不带上数字。
      node.children.unshift({
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'line-number',
          'aria-hidden': 'true',
        },
        children: [{ type: 'text', value: String(line) }],
      });
      return node;
    },
  };
}

export default lineNumbers;

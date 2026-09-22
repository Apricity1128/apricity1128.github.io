/**
 * 数学公式预处理（HTML 阶段）
 *
 * 为什么在 HTML 阶段做，而不是 Markdown 阶段：
 * 正文要交给 Astro 自己的 renderMarkdown 渲染，这样标题锚点、代码高亮、图片处理
 * 才和站内其它页面一致。但 Astro 7 的 Sätteri 处理器虽然内置数学解析
 * （features.math），实测无法通过 markdown.processor 干预，公式会原样留下 $ 符号。
 *
 * 所以顺序是：Astro 正常渲染 Markdown → 在产出的 HTML 上把 $...$ / $$...$$ 换成
 * KaTeX HTML。这时公式是纯文本节点，替换结果直接作为 HTML 输出，稳定可控。
 *
 * 在 HTML 阶段需要额外避开代码块：Astro 的高亮代码块是
 * <pre class="astro-code" data-language="js">，里面的 $ 不能当公式处理。
 */
import katex from 'katex';

/** 公式渲染失败的兜底样式类 */
const FALLBACK_CLASS = 'katex-fallback';

function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

/** 渲染单个公式；出错时降级为原始文本，绝不让构建失败 */
function renderTex(tex, displayMode) {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
      trust: false,
    });
  } catch (error) {
    return `<code class="${FALLBACK_CLASS}" title="公式渲染失败">${escapeHtml(tex)}</code>`;
  }
}

/**
 * 把 HTML 里的公式渲染成 KaTeX。
 *
 * 做法：先把 <pre>…</pre> 和 <code>…</code> 整段摘出来换成占位符，
 * 这样代码块里的 $ 不会被误判；处理完公式再还原。
 *
 * @param {string} html Astro 渲染出来的 HTML
 * @returns {string}
 */
export function renderMathInHtml(html) {
  if (typeof html !== 'string' || !html.includes('$')) return html;

  const stash = [];
  const hide = (text) => {
    const token = `\u0000MATH${stash.length}\u0000`;
    stash.push(text);
    return token;
  };

  // 1. 保护代码块（<pre> 整体，含其内部 <code>）
  let out = html.replace(/<pre\b[\s\S]*?<\/pre>/gi, (m) => hide(m));
  // 2. 保护行内代码
  out = out.replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, (m) => hide(m));
  // 3. 保护已有的 KaTeX 输出（避免重复处理）
  out = out.replace(/<span class="katex[\s\S]*?<\/span><\/span>/gi, (m) => hide(m));

  // 4. 行间公式 $$...$$
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => {
    const rendered = renderTex(String(tex).trim(), true);
    // 包一层 <p>，让行间公式和普通段落一样有垂直间距
    return `</p><p class="math-display-block">${rendered}</p><p>`;
  });

  // 5. 行内公式 $...$
  //    (?<!\\) 排除转义的 \$；要求 $ 后面不是空白，避免误伤 "价格 $5" 这类文本
  out = out.replace(/(?<!\\)\$(?!\s)([^$\n]+?)(?<!\\)\$/g, (_m, tex) => {
    return renderTex(String(tex).trim(), false);
  });

  // 6. 还原代码
  out = out.replace(/\u0000MATH(\d+)\u0000/g, (_m, i) => stash[Number(i)]);

  // 7. 还原转义的 \$
  out = out.replace(/\\\$/g, '$');

  return out;
}

/**
 * 给「原始 Markdown」生成纯文本摘要时用。
 *
 * 目标是让摘要读起来通顺，而不是把公式整个删掉 —— 直接删会得到
 * 「给定序列，数字，求有多少的可重子集」这种缺主语的病句。
 * 所以：
 *   · 行间公式（一般是推导过程）整段去掉
 *   · 行内公式保留内容，只去掉 $ 和 LaTeX 记法（\frac{a}{b} → a/b）
 */
export function stripMathFromText(text) {
  return (
    String(text)
      // 行间公式整段删除：这类通常是推导，放进摘要没意义
      .replace(/\$\$[\s\S]+?\$\$/g, ' ')
      // 行内公式保留内容，去掉定界符和常见 LaTeX 命令
      .replace(/(?<!\\)\$(?!\s)([^$\n]+?)(?<!\\)\$/g, (_m, tex) => ` ${normaliseTex(tex)} `)
  );
}

/** 把 LaTeX 片段压成可读的纯文本 */
function normaliseTex(tex) {
  return String(tex)
    // \frac{a}{b} → a/b，\dfrac 同理
    .replace(/\\(?:d|t)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2')
    // \binom{a}{b} → C(a,b)
    .replace(/\\binom\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, 'C($1,$2)')
    // \sqrt{a} → √a
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, '√$1')
    // 下标 a_{n/2} → a_n/2
    .replace(/_\{([^{}]*)\}/g, '_$1')
    .replace(/\^\{([^{}]*)\}/g, '^$1')
    // 剩下的希腊字母/符号命令去掉反斜杠
    .replace(/\\[a-zA-Z]+/g, '')
    // 收尾清理多余空白和残留的括号
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

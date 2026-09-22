/**
 * 代码块增强（客户端）
 *
 * Astro 用 Shiki 在构建期生成 <pre class="astro-code" data-language="ts">，
 * 这里在浏览器里给它补上「语言标签 + 复制按钮」的头部，
 * 顺便处理复制失败时的降级方案。
 */

const LABELS = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  astro: 'Astro',
  vue: 'Vue',
  css: 'CSS',
  scss: 'SCSS',
  html: 'HTML',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  md: 'Markdown',
  markdown: 'Markdown',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  zsh: 'Zsh',
  powershell: 'PowerShell',
  py: 'Python',
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  sql: 'SQL',
  diff: 'Diff',
  toml: 'TOML',
  ini: 'INI',
  text: 'Text',
};

/** 复制文本，优先用 Clipboard API，失败时回退到 execCommand */
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 继续走回退方案 */
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function enhance(pre) {
  if (pre.dataset.enhanced === 'true') return;
  pre.dataset.enhanced = 'true';

  const code = pre.querySelector('code');
  if (!code) return;

  const rawLang = pre.getAttribute('data-language') ?? '';
  const lang = LABELS[rawLang.toLowerCase()] ?? rawLang ?? '';

  // 包一层容器，方便放头部
  const wrapper = document.createElement('div');
  wrapper.className = 'code-block';
  pre.parentNode?.insertBefore(wrapper, pre);
  wrapper.appendChild(pre);

  const head = document.createElement('div');
  head.className = 'code-block__head';

  const label = document.createElement('span');
  label.className = 'code-block__lang';
  label.textContent = lang;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'code-block__copy';
  button.textContent = '复制';
  button.setAttribute('aria-label', '复制代码');

  let resetTimer;
  button.addEventListener('click', async () => {
    const ok = await copyText(code.textContent ?? '');
    button.textContent = ok ? '已复制' : '复制失败';
    button.dataset.copied = String(ok);

    clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      button.textContent = '复制';
      delete button.dataset.copied;
    }, 1800);
  });

  head.append(label, button);
  wrapper.insertBefore(head, pre);
}

export function enhanceCodeBlocks(root = document) {
  root.querySelectorAll('pre.astro-code').forEach(enhance);
}

enhanceCodeBlocks();

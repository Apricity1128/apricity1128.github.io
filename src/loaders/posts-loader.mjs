#!/usr/bin/env node
/**
 * 文章加载器 —— 让「丢一个 md 进 posts/ 就能发布」成立
 *
 * 设计目标：作者只写正文，其余全部自动推导。
 *
 * 目录结构：
 *   posts/2026-02-05-你好世界.md   ← 日期可以写在文件名里（推荐，最稳）
 *   posts/我的随笔.md              ← 也可以不写日期
 *
 * 每个字段的推导优先级：
 *   title        frontmatter.title  →  正文第一个 # 标题  →  文件名
 *   pubDate      frontmatter.pubDate → 文件名里的日期 → git 提交时间 → 文件修改时间
 *   updatedDate  frontmatter.updatedDate → git 最近提交时间
 *   description  frontmatter.description → 正文前 160 字
 *   slug         frontmatter.slug → 文件名（去掉日期前缀）
 *
 * 关于日期，这里特意用了 git 提交时间而不是文件系统 mtime：
 * 文件系统 mtime 在 CI 每次全新 checkout 后都会变成构建那一刻，
 * 会导致所有老文章的日期一起漂移；而 git 提交时间是存在 git 对象里的，
 * 换机器、重新克隆都不会变。只有本地刚写好、还没提交的文件才回退到 mtime。
 */
import { promises as fs, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { renderMathInHtml, stripMathFromText } from '../utils/math.mjs';

const execFileAsync = promisify(execFile);

const MARKDOWN_EXT = new Set(['.md', '.markdown', '.mdx']);

/** 文件名里的日期前缀：2026-02-05-标题.md 或 2026-02-05.md */
const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})[-_ ]?/;

/**
 * 把 frontmatter 与正文拆开。
 * 只认文件最开头以 `---` 单独成行的形式，和 Astro 官方行为一致。
 */
function splitFrontmatter(contents) {
  const normalised = contents.replace(/^\uFEFF/, '');

  if (!normalised.startsWith('---')) {
    return { data: {}, body: normalised };
  }

  // 找到结束的 --- 行
  const match = /^---[ \t]*\r?\n([\s\S]*?)^---[ \t]*(?:\r?\n|$)/m.exec(normalised);
  if (!match) {
    // 只有开头没有结尾，视为没有 frontmatter，整体当正文
    return { data: {}, body: normalised };
  }

  const rawYaml = match[1];
  const body = normalised.slice(match[0].length);

  try {
    const parsed = parseYaml(rawYaml);
    // frontmatter 必须是键值映射，否则忽略
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { data: {}, body };
    }
    // yaml 会把 2026-02-05 解析成 Date，这里统一转成字符串交给 schema 处理
    for (const [key, value] of Object.entries(parsed)) {
      if (value instanceof Date) parsed[key] = value.toISOString().slice(0, 10);
    }
    return { data: parsed, body };
  } catch (error) {
    // YAML 写错了不能静默吞掉，要让作者看见
    throw new Error(
      `frontmatter 解析失败：${error.message}\n` +
        `请检查文件开头的 --- 之间的 YAML 格式（常见问题：冒号后缺少空格、缩进不一致）。`
    );
  }
}

/** 去掉正文里代码块和 Markdown 标记，取前 N 个字做摘要 */
function deriveDescription(body, length = 160) {
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+.*$/gm, ' ')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

/** 从正文里找第一个 H1 当作标题 */
function extractHeadingTitle(body) {
  // 只看正文开头部分，避免把正文中间的标题误当文章标题
  const head = body.slice(0, 2000);
  const match = /^\s{0,3}#\s+(.+?)\s*#*\s*$/m.exec(head);
  if (!match) return '';
  return match[1].replace(/[*_`]/g, '').trim();
}

/** 由文件名推导标题：去掉日期前缀，把连字符/下划线换成空格 */
function titleFromFilename(stem) {
  const withoutDate = stem.replace(DATE_PREFIX, '');
  return withoutDate.replace(/[-_]+/g, ' ').trim() || stem;
}

/** 由文件名推导 slug：去掉日期前缀，空格转连字符 */
function slugFromFilename(stem) {
  const withoutDate = stem.replace(DATE_PREFIX, '');
  return (
    withoutDate
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || stem
  );
}

/** 文件名里的日期，返回 YYYY-MM-DD 或 null */
function dateFromFilename(stem) {
  const match = DATE_PREFIX.exec(stem);
  if (!match) return null;
  const [, y, m, d] = match;
  const iso = `${y}-${m}-${d}`;
  // 校验是不是真实存在的日期（挡掉 2026-13-45 这种）
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

/**
 * 读取 git 提交时间。
 *
 * 用 --follow 让文件重命名后历史依然连续。
 * 任何一步失败（不是 git 仓库、文件还没提交、机器上没有 git）都安静地返回
 * null，由调用方回退到文件系统 mtime —— 构建绝不能因为拿不到 git 信息而失败。
 */

/** 取 git 创建时间（最早一次提交） */
async function gitCreated(filePath, cwd) {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '--reverse', '--follow', '--format=%cI', '--', filePath],
      { cwd, windowsHide: true, maxBuffer: 1024 * 1024 }
    );
    const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.length ? lines[0] : null;
  } catch {
    return null;
  }
}

/** 取 git 最近一次提交时间 */
async function gitUpdated(filePath, cwd) {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '-1', '--follow', '--format=%cI', '--', filePath],
      { cwd, windowsHide: true, maxBuffer: 1024 * 1024 }
    );
    const value = stdout.trim();
    return value || null;
  } catch {
    return null;
  }
}

/**
 * 创建文章加载器。
 *
 * @param {object} options
 * @param {string} options.base 相对项目根目录的文章目录，例如 'posts'
 */
export function postsLoader({ base = 'posts' } = {}) {
  return {
    name: 'posts-loader',
    load: async ({ config, store, logger, parseData, generateDigest, watcher, renderMarkdown }) => {
      const dir = resolve(fileURLToPathSafe(config.root), base);
      const log = logger.fork('posts');

      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
        log.warn(`文章目录不存在，已自动创建：${base}/`);
      }

      const projectRoot = fileURLToPathSafe(config.root);

      // 判断是否在 git 仓库里，避免每个文件都去 fork 一次 git 进程
      const inGit = existsSync(join(projectRoot, '.git'));
      if (!inGit) {
        log.warn('未检测到 .git 目录，文章日期将回退为文件修改时间。');
      }

      /**
       * 同步文章目录到 store。
       *
       * 抽成函数是因为 dev 模式下要重复调用：光注册 watcher 回调**不会**让 Astro
       * 重跑这个 loader，必须在回调里自己重新同步 store，再由 store 的变更通知
       * Astro 让内容模块失效。官方 glob loader 也是这么做的（它在回调里直接写 store）。
       */
      async function syncAll({ quiet = false } = {}) {
        const files = await collectMarkdownFiles(dir);
        const seenIds = new Set();

        // 本次同步开始前 store 里已有的条目，最后用来清理「已被删除的文章」。
        // 漏掉这一步会导致删掉 md 文件后，旧文章依然留在列表、路由和搜索索引里。
        const staleIds = new Set(store.keys());

        for (const filePath of files) {
          const relPath = relative(projectRoot, filePath).split(sep).join('/');
          const baseName = relPath.slice(relPath.lastIndexOf('/') + 1);
          const stem = baseName.slice(0, baseName.length - extname(baseName).length);

          const contents = await fs.readFile(filePath, 'utf8');
          const { data: frontmatter, body } = splitFrontmatter(contents);

          // ---- slug / id ----
          const slug =
            (typeof frontmatter.slug === 'string' && frontmatter.slug.trim()) ||
            slugFromFilename(stem);

          if (seenIds.has(slug)) {
            throw new Error(
              `文章 slug 重复：「${slug}」。` +
                `两个文件推导出了同一个 slug，请重命名其中一个，或在 frontmatter 里加 slug 字段区分。`
            );
          }
          seenIds.add(slug);

          // ---- 日期 ----
          const stat = await fs.stat(filePath);
          const nameDate = dateFromFilename(stem);

          let createdIso = null;
          let updatedIso = null;
          if (inGit) {
            [createdIso, updatedIso] = await Promise.all([
              gitCreated(relPath, projectRoot),
              gitUpdated(relPath, projectRoot),
            ]);
          }

          const pubDate =
            frontmatter.pubDate ?? nameDate ?? createdIso ?? stat.mtime.toISOString();
          const updatedDate =
            frontmatter.updatedDate ??
            (updatedIso && updatedIso !== createdIso ? updatedIso : undefined);

          // ---- 标题与摘要 ----
          // 摘要要先把公式整体去掉，否则 $a$、\frac{a}{b} 这类 LaTeX 源码会
          // 原样进 meta description 和列表页，看起来像乱码。
          const title =
            (typeof frontmatter.title === 'string' && frontmatter.title.trim()) ||
            extractHeadingTitle(body) ||
            titleFromFilename(stem);

          const description =
            (typeof frontmatter.description === 'string' && frontmatter.description.trim()) ||
            deriveDescription(stripMathFromText(body));

          const data = await parseData({
            id: slug,
            filePath: relPath,
            data: {
              ...frontmatter,
              title,
              description,
              pubDate,
              updatedDate,
              tags: normaliseTags(frontmatter.tags),
            },
          });

          // ---- 渲染 HTML ----
          //
          // 这一步是必须的：astro:content 的 render(entry) 在自定义加载器下用的是
          // entry.rendered.html，而**不是** entry.body（见 astro/dist/content/runtime.js
          // 的 renderEntry）。只 set body、rendered 留空的话，正文会整个消失。
          //
          // 顺序很关键：先让 Astro 渲染原始 Markdown（这样标题锚点、代码高亮、
          // 图片处理和站内其它页面完全一致），再在产出的 HTML 上把公式换成 KaTeX。
          // 反过来先处理 Markdown 会把 frontmatter 解析搞乱。
          let rendered;
          if (typeof renderMarkdown === 'function') {
            const result = await renderMarkdown(contents, { fileURL: pathToFileURL(filePath) });
            const rawHtml = result.html ?? result.code ?? '';
            rendered = {
              html: renderMathInHtml(rawHtml),
              metadata: {
                headings: result.metadata?.headings ?? [],
                imagePaths: result.metadata?.imagePaths ?? [],
                frontmatter: result.metadata?.frontmatter ?? {},
              },
            };
          }

          store.set({
            id: slug,
            data,
            // body 存原始正文：目录、阅读时长、搜索都基于它，保持和作者写的一致
            body,
            filePath: relPath,
            // 注意：这里**不能**传 digest。
            // store.set 在 digest 与已有条目相同时会直接 return false 跳过写入，
            // 而 Astro 在两次加载之间会把 store 序列化再读回，rendered（渲染好的
            // HTML）在往返中会丢失 —— 结果是第二次加载被跳过，页面上正文整个消失。
            // digest 那套去重是给官方 glob loader 的增量渲染用的，这里不适用。
            rendered,
          });

          staleIds.delete(slug);
        }

        // 清理源文件已经不存在（或被改名）的条目
        let removed = 0;
        for (const id of staleIds) {
          store.delete(id);
          removed++;
        }

        if (!quiet) {
          log.info(
            removed > 0
              ? `已载入 ${files.length} 篇文章，清理了 ${removed} 篇已删除的文章`
              : `已载入 ${files.length} 篇文章`
          );
        }

        return { count: files.length, removed, files };
      }

      const { files } = await syncAll();

      // ---- dev 模式热更新 ----
      if (watcher) {
        for (const filePath of files) {
          watcher.add(filePath);
        }
        // 也加目录，这样「新增文件」这种事件能进来
        watcher.add(dir);

        /** 只关心 posts/ 下的 markdown，忽略 .astro/、node_modules/ 等噪声 */
        const isPostFile = (changedPath) => {
          if (typeof changedPath !== 'string') return false;
          const normalized = changedPath.split(sep).join('/');
          if (!normalized.includes(`/${base.replace(/\/+$/, '')}/`)) return false;
          const name = normalized.slice(normalized.lastIndexOf('/') + 1);
          if (name.startsWith('.') || name.startsWith('_')) return false;
          return MARKDOWN_EXT.has(extname(name).toLowerCase());
        };

        const onChange = (reason) => async (changedPath) => {
          if (!isPostFile(changedPath)) return;
          const name = relative(projectRoot, changedPath).split(sep).join('/');
          try {
            const { count } = await syncAll({ quiet: true });
            log.info(`检测到文章${reason}：${name}（当前共 ${count} 篇）`);
          } catch (error) {
            // 例如 frontmatter 写错：报告出来，但不要崩掉 dev server
            log.error(`重新载入失败：${error.message}`);
          }
        };

        watcher.on('add', onChange('新增'));
        watcher.on('change', onChange('修改'));
        watcher.on('unlink', onChange('删除'));
      }
    },
  };
}

/** 标签统一成字符串数组 */
function normaliseTags(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/** 递归收集目录下的 markdown 文件，跳过以 . 或 _ 开头的文件 */
async function collectMarkdownFiles(dir) {
  const out = [];

  async function walk(current) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && MARKDOWN_EXT.has(extname(entry.name).toLowerCase())) {
        out.push(full);
      }
    }
  }

  await walk(dir);
  return out.sort();
}

/**
 * config.root 在 Astro 里是 file:// URL，用 Node 自带的 fileURLToPath 转换，
 * 它已经正确处理了 Windows 盘符和路径转义，不要自己拼。
 */
function fileURLToPathSafe(root) {
  if (typeof root === 'string') return root;
  if (root instanceof URL) return fileURLToPath(root);
  return String(root);
}

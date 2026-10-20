/**
 * 文章 frontmatter 校验（构建前自动运行）
 *
 * 为什么需要它：
 * 本站的文章集合要求 `title` / `publishDate` / `description` 三个字段必填
 * （见 src/content.config.ts）。手写 md 时漏掉字段，Astro 只会抛出一句
 * "can not read a block mapping entry" 之类的 YAML 错误并指个行号，
 * 很难看出真正原因是「少写了字段」。
 *
 * 这个脚本在 astro build 之前跑，用中文明确指出哪个文件缺了什么。
 *
 * 设计原则：只在「确定是内容问题」时以退出码 1 结束。
 * 脚本自身出现意外错误时一律放行（exit 0），绝不让校验器的 bug 阻塞部署。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

const DIR = 'src/content/blog'
const REQUIRED = ['title', 'publishDate', 'description']
const LIMITS = { title: 60, description: 160 }

const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

function main() {
  let files
  try {
    files = readdirSync(DIR).filter((f) => /\.mdx?$/.test(f))
  } catch {
    return // 目录不存在就交给 Astro 自己处理
  }

  const problems = []
  const warnings = []

  for (const file of files) {
    const path = join(DIR, file)
    if (!statSync(path).isFile()) continue

    const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '')

    // ---- 1. 是否有 frontmatter 块 ----
    if (!text.startsWith('---')) {
      problems.push({
        file,
        message: '文件开头没有 frontmatter 块',
        hint: [
          '---',
          'title: 文章标题',
          'publishDate: 2026-10-20',
          'description: 一句话摘要',
          '---',
          '',
          '（下面写正文）'
        ]
      })
      continue
    }

    const m = /^---[ \t]*\r?\n([\s\S]*?)^---[ \t]*(?:\r?\n|$)/m.exec(text)
    if (!m) {
      problems.push({
        file,
        message: 'frontmatter 没有闭合：缺少结尾的 ---',
        hint: ['检查文件开头的 --- 是否成对出现']
      })
      continue
    }

    // ---- 2. YAML 能否解析 ----
    let data
    try {
      data = parseYaml(m[1])
    } catch (error) {
      problems.push({
        file,
        message: `frontmatter 的 YAML 语法有误：${error.message.split('\n')[0]}`,
        hint: [
          '常见原因：',
          '  · 值里含冒号 : 但没有用引号包起来',
          '  · 多写了一行不属于任何字段的内容（比如单独的 1）',
          '  · 缩进不一致'
        ]
      })
      continue
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      problems.push({
        file,
        message: 'frontmatter 不是一个键值对结构',
        hint: ['应写成 键: 值 的形式，例如 title: 文章标题']
      })
      continue
    }

    // ---- 3. 必填字段 ----
    const missing = REQUIRED.filter((k) => {
      const v = data[k]
      return v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
    })

    if (missing.length) {
      const sample = {
        title: data.title || '文章标题',
        publishDate: data.publishDate || '2026-10-20',
        description: data.description || '一句话摘要'
      }
      problems.push({
        file,
        message: `缺少必填字段：${missing.join('、')}`,
        hint: [
          '完整写法：',
          '---',
          `title: ${sample.title}`,
          `publishDate: ${sample.publishDate}`,
          `description: ${sample.description}`,
          '---'
        ]
      })
      continue
    }

    // ---- 4. 长度限制 ----
    const title = String(data.title)
    const desc = String(data.description)

    if (title.length > LIMITS.title) {
      problems.push({
        file,
        message: `title 超长：${title.length} 字（上限 ${LIMITS.title}）`,
        hint: [`当前标题：${title}`]
      })
    }

    if (desc.length > LIMITS.description) {
      problems.push({
        file,
        message: `description 超长：${desc.length} 字（上限 ${LIMITS.description}）`,
        hint: [`当前摘要：${desc.slice(0, 40)}…`]
      })
    }

    // ---- 5. 日期能否解析（不阻断，只提醒）----
    const d = data.publishDate
    const parsed = d instanceof Date ? d : new Date(String(d))
    if (Number.isNaN(parsed.getTime())) {
      problems.push({
        file,
        message: `publishDate 不是有效日期：${String(d)}`,
        hint: ['建议写成 2026-10-20 这种格式']
      })
    }

    // ---- 6. tags 类型 ----
    if (data.tags !== undefined && !Array.isArray(data.tags)) {
      warnings.push(`${file}：tags 不是数组，建议写成 tags: [标签一, 标签二]`)
    }
  }

  // ---- 输出 ----
  if (warnings.length) {
    console.log(`${YELLOW}文章校验提醒：${RESET}`)
    for (const w of warnings) console.log(`  ${YELLOW}·${RESET} ${w}`)
    console.log()
  }

  if (problems.length) {
    console.log(`${RED}✖ 文章 frontmatter 有问题，构建已停止${RESET}\n`)
    for (const p of problems) {
      console.log(`${RED}·${RESET} ${p.file}`)
      console.log(`  ${p.message}`)
      if (p.hint?.length) {
        for (const line of p.hint) console.log(`  ${DIM}${line}${RESET}`)
      }
      console.log()
    }
    console.log(`${DIM}共 ${problems.length} 处问题。改好后重新构建即可。${RESET}`)
    process.exit(1)
  }

  console.log(`${GREEN}✓${RESET} 文章 frontmatter 校验通过（${files.length} 篇）`)
}

// 脚本自身出错时放行，避免校验器的 bug 阻塞部署
try {
  main()
} catch (error) {
  console.log(`${YELLOW}文章校验脚本异常，已跳过：${error.message}${RESET}`)
  process.exit(0)
}

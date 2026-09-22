/**
 * 从学校 logo 原图生成适合首页教育经历卡片的版本。
 *
 * 卡片样式是：图片绝对定位在右侧、占 50% 宽度、opacity 40% 作为背景装饰，
 * 所以需要「正方形的校徽标记」而不是横版字标。
 *
 * 振声学校原图是 5008x1246 的横版（校徽 + 中英文校名），且是白色透明底，
 * 在浅色模式下会看不见 —— 这里裁出左侧校徽，并垫一层深色圆角底。
 *
 * ⚠️ 需要先把原图下载到 _dl/ 目录再运行：
 *  山东大学：https://cdn.urongda.com/images/normal/medium/shandong-university-logo-1024px.png → _dl/sdu.png
 *  济南振声：http://www.jnzs.sdu.edu.cn/www/sdsyxx/images/logo1.png                              → _dl/zs.png
 * 生成结果已提交到 public/images/，日常不需要重跑。
 */
import sharp from 'sharp'
import { mkdirSync, existsSync } from 'node:fs'

const SDU_SRC = 'D:/Astro/_dl/sdu.png'
const ZS_SRC = 'D:/Astro/_dl/zs.png'

for (const f of [SDU_SRC, ZS_SRC]) {
  if (!existsSync(f)) {
    console.error(`缺少原图：${f}\n请先按脚本注释里的地址下载后再运行。`)
    process.exit(1)
  }
}

mkdirSync('public/images', { recursive: true })

/* ---------------- 山东大学 ---------------- */
// 原图是 1024x1020 的正方形校徽，红白配色，两种模式都清晰，直接缩放即可
await sharp('D:/Astro/_dl/sdu.png')
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile('public/images/shandong-university.png')
console.log('✅ public/images/shandong-university.png')

/* ---------------- 济南振声学校 ---------------- */
// 原图 5008x1246：左侧是校徽图标，右侧是「济南振声学校」字标 + 英文。
// 先裁左侧正方形区域取出校徽。
const meta = await sharp(ZS_SRC).metadata()
const markSize = Math.min(meta.height, Math.round(meta.width * 0.25))

const mark = await sharp(ZS_SRC)
  .extract({ left: 0, top: 0, width: markSize, height: meta.height })
  .resize(420, 420, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()

// 垫深色圆角底：校徽本身是白色，放在深色底上在浅色与深色模式下都可见
const BG = { r: 24, g: 30, b: 46 }
const size = 512
const bg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
     <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="rgb(${BG.r},${BG.g},${BG.b})"/>
   </svg>`
)

await sharp(bg)
  .composite([{ input: mark, gravity: 'center' }])
  .png()
  .toFile('public/images/jinan-zhensheng.png')
console.log('✅ public/images/jinan-zhensheng.png')

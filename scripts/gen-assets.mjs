/**
 * 生成站点资源：
 *   1. src/assets/avatar.jpg  —— 首页头像（替换原作者的）
 *   2. public/images/social-card.png —— 社交分享卡片（OG image）
 *
 * 用 sharp 直接合成，不依赖任何外部图片。
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const WARM = { r: 246, g: 178, b: 94 }
const WARM_DARK = { r: 180, g: 101, b: 58 }

/** 生成一个暖色渐变圆角方块的 SVG（用作头像底） */
function avatarSvg(size) {
  const r = size / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(${WARM.r},${WARM.g},${WARM.b})"/>
      <stop offset="100%" stop-color="rgb(${WARM_DARK.r},${WARM_DARK.g},${WARM_DARK.b})"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <text x="50%" y="52%" text-anchor="middle" dominant-baseline="central"
    font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${size * 0.46}"
    font-weight="600" fill="#fffdf9">A</text>
</svg>`
}

/** 社交分享卡片 */
function socialCardSvg(w, h) {
  const pad = Math.round(w * 0.08)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1b1c22"/>
      <stop offset="100%" stop-color="#0e0f13"/>
    </linearGradient>
    <linearGradient id="dot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(${WARM.r},${WARM.g},${WARM.b})"/>
      <stop offset="100%" stop-color="rgb(${WARM_DARK.r},${WARM_DARK.g},${WARM_DARK.b})"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${pad + 26}" cy="${h / 2 - 78}" r="26" fill="url(#dot)"/>
  <text x="${pad + 26}" y="${h / 2 - 68}" text-anchor="middle"
    font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="30"
    font-weight="700" fill="#0e0f13">A</text>
  <text x="${pad}" y="${h / 2 + 22}" font-family="Segoe UI, Helvetica, Arial, sans-serif"
    font-size="${Math.round(w * 0.085)}" font-weight="700" fill="#f2f3f5">Apricity</text>
  <text x="${pad}" y="${h / 2 + 84}" font-family="Segoe UI, Helvetica, Arial, sans-serif"
    font-size="${Math.round(w * 0.030)}" fill="#9aa0ab">记录思考与生活</text>
  <text x="${pad}" y="${h - pad + 10}" font-family="Segoe UI, Helvetica, Arial, sans-serif"
    font-size="${Math.round(w * 0.026)}" fill="#6b7280">apricity1128.github.io</text>
</svg>`
}

mkdirSync('public/images', { recursive: true })

await sharp(Buffer.from(avatarSvg(512))).jpeg({ quality: 92 }).toFile('src/assets/avatar.jpg')
console.log('✅ src/assets/avatar.jpg')

await sharp(Buffer.from(socialCardSvg(1200, 630))).png().toFile('public/images/social-card.png')
console.log('✅ public/images/social-card.png')

/* ---------------- 站点图标 ---------------- */

/** 小尺寸图标：暖色圆角方块 + 白色 A，圆角比例更小以便在 16px 下也看得清 */
function faviconSvg(size) {
  const r = Math.round(size * 0.22)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(${WARM.r},${WARM.g},${WARM.b})"/>
      <stop offset="100%" stop-color="rgb(${WARM_DARK.r},${WARM_DARK.g},${WARM_DARK.b})"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#f)"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="central"
    font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${size * 0.62}"
    font-weight="700" fill="#fffdf9">A</text>
</svg>`
}

const ICON_SIZES = [
  ['public/favicon/favicon-16x16.png', 16],
  ['public/favicon/favicon-32x32.png', 32],
  ['public/favicon/apple-touch-icon.png', 180],
  ['public/favicon/android-chrome-192x192.png', 192],
  ['public/favicon/android-chrome-512x512.png', 512]
]

for (const [file, size] of ICON_SIZES) {
  await sharp(Buffer.from(faviconSvg(size))).png().toFile(file)
  console.log(`✅ ${file}`)
}

// .ico 直接用 32px PNG 充当（现代浏览器都支持 PNG 格式的 ico）
await sharp(Buffer.from(faviconSvg(32))).resize(32, 32).toFormat('png').toFile('public/favicon/favicon.ico')
console.log('✅ public/favicon/favicon.ico')


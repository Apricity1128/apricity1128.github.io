/**
 * 生成「洛天依」风格的站点图标。
 *
 * 关于版权：洛天依是有版权的虚拟歌手形象，官方立绘/logo 不能直接拿来做站点图标。
 * 所以这里用**原创几何图形**，只借用她最具识别度的配色（冷灰 / 青蓝），
 * 配一个简洁的八分音符 —— 方向明确，但不复制任何受版权保护的素材。
 */
import { writeFileSync } from 'node:fs'
import sharp from 'sharp'

/** 洛天依色系：冷灰蓝 + 亮青 */
const C = {
  deep: '#26333f',
  mid: '#456176',
  light: '#c3d9e6',
  pale: '#eef5fa',
  accent: '#6fd0e6'
}

/**
 * 画一个八分音符：椭圆符头 + 符干 + 单条符尾。
 *
 * 用 100x100 的坐标系，方便直接用比例调位置。
 * 关键尺寸：
 *   符头 圆心 (40,70) 半径 15x11.5，向左下倾斜 20°
 *   符干 从 (52,26) 到 (52,70)，宽 7
 *   符尾 从符干顶端向右侧扬起的一条弧
 */
function noteSvg(size) {
  const r = (size * 0.23).toFixed(2)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.mid}"/>
      <stop offset="100%" stop-color="${C.deep}"/>
    </linearGradient>
    <linearGradient id="note" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="${C.pale}"/>
      <stop offset="100%" stop-color="${C.light}"/>
    </linearGradient>
    <!-- 圆角方块裁剪：装饰元素不能溢出图标边界 -->
    <clipPath id="clip">
      <rect width="100" height="100" rx="${r}"/>
    </clipPath>
  </defs>

  <rect width="100" height="100" rx="${r}" fill="url(#bg)"/>

  <g clip-path="url(#clip)">
    <!-- 内侧柔光：位置收进来并降低不透明度，避免在大圆角处形成一圈亮边 -->
    <circle cx="68" cy="34" r="22" fill="${C.accent}" opacity="0.10"/>

    <!-- 符干 -->
    <rect x="48.5" y="24" width="7.5" height="48" rx="3.75" fill="url(#note)"/>

    <!-- 符尾：从符干顶端向右上扬起的弧 -->
    <path d="M56 24 C 68 28, 76 38, 78 52
             C 72 42, 66 37, 56 34 Z" fill="url(#note)"/>

    <!-- 符头：倾斜的椭圆 -->
    <ellipse cx="40" cy="70.5" rx="15" ry="11.5"
             transform="rotate(-20 40 70.5)" fill="url(#note)"/>

    <!-- 装饰点 -->
    <circle cx="28" cy="38" r="3.8" fill="${C.accent}" opacity="0.9"/>
  </g>
</svg>`
}

const SIZES = [
  ['public/favicon/favicon-16x16.png', 16],
  ['public/favicon/favicon-32x32.png', 32],
  ['public/favicon/apple-touch-icon.png', 180],
  ['public/favicon/android-chrome-192x192.png', 192],
  ['public/favicon/android-chrome-512x512.png', 512]
]

for (const [file, size] of SIZES) {
  await sharp(Buffer.from(noteSvg(size))).png().toFile(file)
  console.log(`✅ ${file}`)
}

await sharp(Buffer.from(noteSvg(32))).toFormat('png').toFile('public/favicon/favicon.ico')
console.log('✅ public/favicon/favicon.ico')

writeFileSync('public/favicon/icon.svg', noteSvg(512), 'utf8')
console.log('✅ public/favicon/icon.svg')

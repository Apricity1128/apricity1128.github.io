/**
 * 站点全局配置
 *
 * 想改站名、简介、头像、社交链接，改这一个文件就够了。
 * 首页、导航、页脚、RSS、Sitemap 都从这里读。
 */

export const SITE = {
  /** 站点完整地址（GitHub Pages 用户站点，部署在根路径） */
  url: 'https://apricity1128.github.io',

  /** 仓库地址 */
  repo: 'https://github.com/Apricity1128/apricity1128.github.io',

  /** 站点标题：显示在导航栏和浏览器标签 */
  title: 'Apricity',

  /** 站点副标题 */
  subtitle: '记录思考与生活',

  /** 站点简介，用于 SEO 和 RSS */
  description: 'Apricity 的个人博客 —— 记录技术、阅读与生活的地方。',

  /** 默认语言 */
  lang: 'zh-CN',

  /** 作者信息 */
  author: {
    name: 'Apricity',
    email: '',
    /** 头像：把图片放到 public/ 下，然后改这里 */
    avatar: '/avatar.svg',
    /** 显示在首页的位置标签 */
    location: 'China',
    /** 一句话介绍 */
    bio: '开发者 / 终身学习者',
  },

  /** 首页「关于」区块的正文（支持 Markdown 行内语法） */
  about: [
    '你好，我叫 Apricity。欢迎来到我的小站。',
    '这里用来存放我在学习和折腾过程中留下的东西——技术笔记、读书摘录，以及一些没头没尾的想法。',
    '我相信写作是最好的思考方式。把散落各处的笔记整理成文，既能帮自己回顾，也可能恰好帮到屏幕前的你。',
  ],

  /** 语言标签页展示名 */
  nav: [
    { label: '博客', href: '/blog' },
    { label: '项目', href: '/projects' },
    { label: '友链', href: '/links' },
    { label: '关于', href: '/about' },
  ],

  /** 社交链接（页脚和首页展示） */
  socials: [
    { label: 'GitHub', href: 'https://github.com/Apricity1128', icon: 'github' },
    { label: 'Email', href: 'mailto:hello@example.com', icon: 'mail' },
    { label: 'RSS', href: '/rss.xml', icon: 'rss' },
  ],

  /** 教育/经历时间线，显示在首页 */
  education: [
    {
      school: '你的学校',
      degree: '你的专业 · 学位',
      period: '2022 - 2026',
      href: '',
    },
  ],

  /** 技能分组，显示在首页 */
  skills: [
    {
      group: 'Languages',
      items: ['TypeScript', 'JavaScript', 'Python', 'C++', 'SQL'],
    },
    {
      group: 'Frontend',
      items: ['Astro', 'Vue.js', 'React', 'Tailwind CSS', 'HTML / CSS'],
    },
    {
      group: 'Tools',
      items: ['Git', 'Linux', 'Docker', 'Nginx', 'Vite'],
    },
  ],

  /** 首页「文章」区块最多显示几篇 */
  homePostLimit: 10,

  /** 页脚版权起始年份 */
  since: 2026,
};

export default SITE;

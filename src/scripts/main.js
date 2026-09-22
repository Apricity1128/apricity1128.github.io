/**
 * 站点脚本入口
 * 目前只有代码块增强；主题切换和滚动效果在 Header.astro 里内联，
 * 因为它们要尽早执行。
 */
import { enhanceCodeBlocks } from './code-blocks.js';

enhanceCodeBlocks();

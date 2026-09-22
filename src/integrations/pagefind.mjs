/**
 * Pagefind 集成
 *
 * Pagefind 是一个「构建后」运行的静态全文搜索引擎：它扫描 dist/ 里生成的
 * HTML，产出一份分片索引，浏览器端再按需加载。
 *
 * 因为索引必须在 HTML 生成之后才能建立，这里挂在 astro:build:done 钩子上，
 * 不需要在 npm scripts 里再串一条命令。
 *
 * 产物写到 dist/pagefind/，前端从 /pagefind/pagefind.js 加载。
 */
import { fileURLToPath } from 'node:url';

export default function pagefind() {
  let outDir;

  return {
    name: 'pagefind',
    hooks: {
      'astro:config:done': ({ config }) => {
        outDir = fileURLToPath(config.outDir);
      },

      'astro:build:done': async ({ logger, pages }) => {
        const log = logger.fork('pagefind');

        try {
          const { createIndex } = await import('pagefind');

          // createIndex() 返回 { errors, index }
          const { errors: createErrors, index } = await createIndex();

          if (!index) {
            throw new Error(`无法创建索引：${createErrors.join(', ') || '未知原因'}`);
          }

          // 索引 dist 下的全部 HTML
          // addDirectory() 返回 { errors, page_count }
          const { errors: indexErrors, page_count } = await index.addDirectory({
            path: outDir,
          });

          const skipped = [...createErrors, ...indexErrors];

          // writeFiles() 返回 { errors, outputPath }
          const { errors: writeErrors, outputPath } = await index.writeFiles({
            outputPath: `${outDir}/pagefind`,
          });

          if (writeErrors.length) {
            throw new Error(`写入索引失败：${writeErrors.join(', ')}`);
          }

          log.info(
            `已索引 ${page_count} 个页面（源文件 ${pages.length} 个）→ ${outputPath}`
          );

          if (skipped.length) {
            log.warn(`跳过 ${skipped.length} 项：${skipped.slice(0, 5).join(', ')}`);
          }
        } catch (error) {
          log.error(
            `索引失败：${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      },
    },
  };
}

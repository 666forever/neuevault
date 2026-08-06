import { visualizer } from 'rollup-plugin-visualizer';
import { adminDevMockPlugin } from './scripts/admin/dev-mock-plugin.mjs';

const analyze = process.env.ANALYZE === 'true';

export default {
  build: {
    manifest: true,
  },
  plugins: [adminDevMockPlugin(), ...(analyze ? [visualizer({
    filename: '.bundle-analysis/stats.json',
    template: 'raw-data',
    gzipSize: true,
    brotliSize: true,
  })] : [])].filter(Boolean),
};

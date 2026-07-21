import { visualizer } from 'rollup-plugin-visualizer';

const analyze = process.env.ANALYZE === 'true';

export default {
  build: {
    manifest: true,
  },
  plugins: analyze ? [visualizer({
    filename: '.bundle-analysis/stats.json',
    template: 'raw-data',
    gzipSize: true,
    brotliSize: true,
  })] : [],
};

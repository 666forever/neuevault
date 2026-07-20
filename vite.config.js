import { visualizer } from 'rollup-plugin-visualizer';

const analyze = process.env.ANALYZE === 'true';

export default {
  plugins: analyze ? [visualizer({
    filename: '.bundle-analysis/stats.json',
    template: 'raw-data',
    gzipSize: true,
    brotliSize: true,
  })] : [],
};

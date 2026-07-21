import { describe, expect, it } from 'vitest';
import { collectHashedBuildAssets, immutableCacheControl, renderImmutableRules } from '../../scripts/cache-header-policy.mjs';

describe('hashed Vite cache policy', () => {
  const manifest = {
    index: { file: 'assets/index-Ab12_cdE.js', css: ['assets/index-Zy98_xWv.css'], imports: ['lazy'] },
    lazy: { file: 'assets/searchPage-Qr56_stU.js' },
    publicAsset: { file: 'assets/brand/logo28x28.svg' },
  };

  it('collects only manifest-declared, content-hashed JavaScript and CSS', () => {
    expect(collectHashedBuildAssets(manifest)).toEqual([
      '/assets/index-Ab12_cdE.js',
      '/assets/index-Zy98_xWv.css',
      '/assets/searchPage-Qr56_stU.js',
    ]);
  });

  it('rejects a non-hashed JavaScript or CSS output', () => {
    expect(() => collectHashedBuildAssets({ entry: { file: 'assets/index.js' } })).toThrow(/non-hashed/);
  });

  it('renders exact one-year immutable entries without broad wildcards', () => {
    const rules = renderImmutableRules(collectHashedBuildAssets(manifest));
    expect(rules).toContain(`Cache-Control: ${immutableCacheControl}`);
    expect(rules).not.toContain('/assets/*');
    expect(rules).not.toContain('must-revalidate');
    expect(rules).not.toContain('/assets/brand/');
  });
});

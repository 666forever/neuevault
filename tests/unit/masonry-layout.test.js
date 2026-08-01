import { describe, expect, it } from 'vitest';
import { appendMasonryLayout, createMasonryLayout, resolveMasonryColumnCount, safeAssetRatio } from '../../src/utils/masonryLayout.js';

const item = (id, width = 100, height = 100) => ({ id, width, height });

describe('deterministic masonry layout', () => {
  it('derives reserved height from trusted dimensions and uses a stable fallback', () => {
    expect(safeAssetRatio(item('wide', 400, 200))).toBe(2);
    expect(safeAssetRatio(item('bad', 0, 0))).toBe(1);
    expect(createMasonryLayout([item('wide', 400, 200)], { width: 300, columnCount: 1, gap: 15 }).placements[0].height).toBe(150);
  });

  it('uses shortest-column placement with lowest-index tie breaking', () => {
    const layout = createMasonryLayout([item('a'), item('b'), item('c'), item('d')], { width: 415, columnCount: 2, gap: 15 });
    expect(layout.placements.map(({ id, column }) => [id, column])).toEqual([['a', 0], ['b', 1], ['c', 0], ['d', 1]]);
    expect(layout.containerHeight).toBe(415);
  });

  it('is reproducible and appends without mutating existing placements', () => {
    const first = [item('a', 2, 1), item('b'), item('c', 1, 2)];
    const initial = createMasonryLayout(first, { width: 615, columnCount: 3, gap: 15 });
    const copy = structuredClone(initial.placements);
    const appended = appendMasonryLayout(initial, [item('d'), item('e')]);
    expect(appended.placements.slice(0, copy.length)).toEqual(copy);
    expect(initial.placements).toEqual(copy);
    expect(createMasonryLayout(first, { width: 615, columnCount: 3, gap: 15 }).placements).toEqual(copy);
    expect(appended.placements.map(entry => entry.domIndex)).toEqual([0, 1, 2, 3, 4]);
  });

  it('changes only for a new width or column-count generation', () => {
    expect(resolveMasonryColumnCount(1410)).toBe(4);
    expect(resolveMasonryColumnCount(994)).toBe(3);
    expect(resolveMasonryColumnCount(671)).toBe(2);
    expect(resolveMasonryColumnCount(290, { compact: true, gap: 8 })).toBe(2);
    const assets = [item('a'), item('b'), item('c')];
    expect(createMasonryLayout(assets, { width: 600, columnCount: 2, gap: 15 }).placements)
      .not.toEqual(createMasonryLayout(assets, { width: 900, columnCount: 3, gap: 15 }).placements);
  });
});

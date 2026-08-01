export function safeAssetRatio(asset) {
  const width = +asset?.width;
  const height = +asset?.height;
  const ratio = width / height;
  return width > 0 && height > 0 && ratio >= 0.05 && ratio <= 20 ? ratio : 1;
}

export function resolveMasonryColumnCount(width, { compact = false, gap = 15 } = {}) {
  if (compact) return 2;
  return Math.min(4, Math.max(1, Math.floor((Math.max(0, width) + gap) / (260 + gap))));
}

function shortestColumn(columnHeights) {
  let column = 0;
  for (let index = 1; index < columnHeights.length; index += 1) {
    if (columnHeights[index] < columnHeights[column]) column = index;
  }
  return column;
}

export function appendMasonryLayout(layout, items) {
  const placements = [...layout.placements];
  const columnHeights = [...layout.columnHeights];
  for (const asset of items) {
    const column = shortestColumn(columnHeights);
    const height = layout.columnWidth / safeAssetRatio(asset);
    placements.push({ id: asset.id, domIndex: placements.length, column, x: column * (layout.columnWidth + layout.gap), y: columnHeights[column], width: layout.columnWidth, height });
    columnHeights[column] += height + layout.gap;
  }
  return { ...layout, placements, columnHeights, containerHeight: placements.length ? Math.max(...columnHeights) - layout.gap : 0 };
}

export function createMasonryLayout(items, { width, columnCount, gap }) {
  const safeWidth = Math.max(0, Number(width) || 0);
  const safeColumns = Math.max(1, Math.floor(columnCount) || 1);
  const safeGap = Math.max(0, Number(gap) || 0);
  const columnWidth = (safeWidth - safeGap * (safeColumns - 1)) / safeColumns;
  return appendMasonryLayout({ width: safeWidth, columnCount: safeColumns, gap: safeGap, columnWidth, placements: [], columnHeights: Array(safeColumns).fill(0), containerHeight: 0 }, items);
}

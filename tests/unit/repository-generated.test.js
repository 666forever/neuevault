import { describe, expect, it } from 'vitest';
import generatedAssets from '../../src/generated/assets.json';
import { repository } from '../../src/data/repository.js';

describe('generated repository', () => {
  it('consumes generated manifests behind the existing repository interface', () => {
    expect(repository.getAssets()).toHaveLength(generatedAssets.length);
    const first = generatedAssets[0];
    expect(repository.getAsset(first.id)).toMatchObject({ title: first.title, preview: first.previewFile, src: first.src });
    expect(repository.getCategories()).toEqual([]);
    expect(repository.getCollections()).toEqual([]);
  });
});

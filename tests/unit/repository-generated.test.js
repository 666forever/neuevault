import { describe, expect, it } from 'vitest';
import generatedAssets from '../../src/generated/assets.json';
import generatedCategories from '../../src/generated/categories.json';
import generatedCollections from '../../src/generated/collections.json';
import { repository } from '../../src/data/repository.js';

describe('generated repository', () => {
  it('consumes generated manifests behind the existing repository interface', () => {
    expect(repository.getAssets()).toHaveLength(generatedAssets.length);
    const first = generatedAssets[0];
    expect(repository.getAsset(first.id)).toMatchObject({ title: first.title, preview: first.previewUrl || first.previewFile, src: first.src });
    expect(repository.getCategories().map(item => item.id)).toEqual(generatedCategories.filter(item => item.visible).map(item => item.id));
    expect(repository.getCollections().map(item => item.id)).toEqual(generatedCollections.filter(item => item.public).map(item => item.id));
  });
});

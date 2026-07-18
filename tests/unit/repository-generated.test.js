import { describe, expect, it } from 'vitest';
import generatedAssets from '../../src/generated/assets.json';
import { repository } from '../../src/data/repository.js';

describe('generated repository', () => {
  it('consumes generated manifests behind the existing repository interface', () => {
    expect(repository.getAssets()).toHaveLength(generatedAssets.length);
    expect(repository.getAsset('nv-001')).toMatchObject({ title: 'Silver Static', preview: '/media/previews/nv-001.jpg', src: '/media/originals/nv-001.jpg' });
    expect(repository.getAsset('nv-005')).toMatchObject({ requiresDiscordAuth: true, src: null });
    expect(repository.getCollection('blonde-pfps-v1').cover).toMatch(/^\/media\/previews\//);
  });
});

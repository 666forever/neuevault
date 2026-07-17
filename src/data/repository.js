import data from '../../data.js';
import { validateVaultData } from './schema.js';
import { StaticAssetRepository } from './AssetRepository.js';

export const repository = new StaticAssetRepository(validateVaultData(data));

import { AdminError } from './errors.js';
import { CANONICAL_PATHS, GENERATED_PATHS } from './git-provider.js';

const clone = value => structuredClone(value);
export function createMockGitProvider({ head = 'a'.repeat(40), snapshot, fail = null } = {}) {
  const commits = []; const snapshots = new Map([[head, clone(snapshot)]]); let current = head;
  return {
    commits,
    async readHead() { if (fail === 'read') throw new Error('private provider failure'); return current; },
    async readSnapshot(sha) { if (!snapshots.has(sha)) throw new AdminError(409,'catalog_conflict','The catalog changed before publication.'); return clone(snapshots.get(sha)); },
    async createCommit({ baseSha, files, message }) {
      if (current !== baseSha || fail === 'race') throw new AdminError(409,'catalog_conflict','The catalog changed before publication.');
      if (!Array.isArray(files) || !files.length) throw new Error('No commit files.');
      const commitSha = String(commits.length + 1).padStart(40,'b').slice(-40); commits.push({ baseSha, parents:[baseSha], files:clone(files), message, force:false, commitSha });
      const previous=clone(snapshots.get(baseSha)); const byPath=new Map(files.map(file=>[file.path,JSON.parse(file.content)])); const next={...previous,assetsFile:byPath.get(CANONICAL_PATHS.assets)||previous.assetsFile,categoriesFile:byPath.get(CANONICAL_PATHS.categories)||previous.categoriesFile,collectionsFile:byPath.get(CANONICAL_PATHS.collections)||previous.collectionsFile,cloudinarySync:byPath.get(CANONICAL_PATHS.cloudinary)||previous.cloudinarySync,generated:{assets:byPath.get(GENERATED_PATHS.assets)||previous.generated.assets,categories:byPath.get(GENERATED_PATHS.categories)||previous.generated.categories,collections:byPath.get(GENERATED_PATHS.collections)||previous.generated.collections},catalogVersion:byPath.get(GENERATED_PATHS.version)};
      current = commitSha; snapshots.set(commitSha,next); return { commitSha };
    },
    setHead(sha) { current = sha; },
  };
}

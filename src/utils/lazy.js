const reloadPrefix = 'neuevault:chunk-reload:';

export function isChunkLoadError(error) {
  return /dynamically imported module|module script|chunk.*load|loading.*chunk/i.test(String(error?.message || error));
}

export async function loadLazyModule(loader) {
  const key = `${reloadPrefix}${location.pathname}${location.search}`;
  try {
    const module = await loader();
    sessionStorage.removeItem(key);
    return module;
  } catch (error) {
    if (isChunkLoadError(error) && sessionStorage.getItem(key) !== 'retried') {
      sessionStorage.setItem(key, 'retried');
      location.reload();
      return new Promise(() => {});
    }
    throw error;
  }
}

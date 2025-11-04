const SNAPSHOT_CACHE_NAME = 'cora-notes-offline-cache-v1';
const SNAPSHOT_REQUEST_URL = '__cora_notes_snapshot__';

function createSnapshotRequest() {
  return new Request(SNAPSHOT_REQUEST_URL, { cache: 'reload' });
}

export function createCacheStorageController() {
  const isSupported = () => typeof window !== 'undefined' && 'caches' in window;

  async function withCache(callback) {
    if (!isSupported()) {
      throw new Error('Cache Storage no está disponible');
    }
    const cache = await caches.open(SNAPSHOT_CACHE_NAME);
    return callback(cache);
  }

  async function writeSnapshot(data) {
    if (typeof data !== 'string') {
      throw new TypeError('Snapshot debe ser una cadena serializada');
    }
    return withCache(async (cache) => {
      const response = new Response(data, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
      await cache.put(createSnapshotRequest(), response);
      return true;
    });
  }

  async function readSnapshot() {
    try {
      return await withCache(async (cache) => {
        const match = await cache.match(createSnapshotRequest());
        if (!match) {
          return null;
        }
        return match.text();
      });
    } catch (error) {
      console.warn('No se pudo leer la instantánea desde Cache Storage:', error);
      return null;
    }
  }

  async function clearSnapshot() {
    if (!isSupported()) {
      return;
    }
    await withCache(async (cache) => {
      await cache.delete(createSnapshotRequest());
    });
  }

  async function precacheAssets(urls = []) {
    if (!isSupported() || !Array.isArray(urls) || urls.length === 0) {
      return false;
    }
    try {
      await withCache(async (cache) => {
        await Promise.all(urls.map(async (assetUrl) => {
          try {
            const absolute = new URL(assetUrl, window.location.href);
            const request = new Request(absolute.toString(), { cache: 'reload' });
            const response = await fetch(request);
            if (response?.ok) {
              await cache.put(request, response.clone());
            }
          } catch (assetError) {
            console.warn('No se pudo precachear recurso:', assetUrl, assetError);
          }
        }));
      });
      return true;
    } catch (error) {
      console.warn('No se pudo preparar el caché offline:', error);
      return false;
    }
  }

  return {
    isSupported,
    writeSnapshot,
    readSnapshot,
    clearSnapshot,
    precacheAssets
  };
}

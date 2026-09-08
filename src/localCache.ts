import type { Category, Product } from './types';

export interface CachedUserData {
  categories: Category[];
  capacityUnits: string[];
  products: Product[];
  syncedAt: string;
}

const DATA_CACHE_VERSION = 1;
const dataCacheKey = (uid: string) => `cosmetics_user_data_v${DATA_CACHE_VERSION}_${uid}`;
export const imageCacheName = (uid: string) => `cosmetics-thumbnails-v${DATA_CACHE_VERSION}-${uid}`;

export function readUserCache(uid: string): CachedUserData | null {
  try {
    const raw = localStorage.getItem(dataCacheKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedUserData;
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.products) || !Array.isArray(parsed.capacityUnits)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeUserCache(uid: string, data: CachedUserData) {
  try {
    localStorage.setItem(dataCacheKey(uid), JSON.stringify(data));
  } catch (error) {
    console.warn('[startup] Unable to persist the local data cache', error);
  }
}

export async function clearPrivateUserCache(uid: string) {
  localStorage.removeItem(dataCacheKey(uid));
  localStorage.removeItem(`cosmetics_backup_categories_${uid}`);
  localStorage.removeItem(`cosmetics_backup_products_${uid}`);
  localStorage.removeItem(`cosmetics_gemini_api_keys_${uid}`);
  // Remove backups created by older versions before caches were account-scoped.
  localStorage.removeItem('cosmetics_backup_categories');
  localStorage.removeItem('cosmetics_backup_products');
  localStorage.removeItem('cosmetics_gemini_api_key');

  if ('caches' in window) {
    await caches.delete(imageCacheName(uid));
  }
}

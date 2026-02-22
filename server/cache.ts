export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // in milliseconds
    isFetching?: boolean;
}

export class StrictCache {
    private cache = new Map<string, CacheEntry<unknown>>();

    set<T>(key: string, data: T, ttlMinutes: number = 5): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMinutes * 60 * 1000,
            isFetching: false
        });
    }

    get<T>(key: string, revalidator?: () => Promise<T>): T | null {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;
        if (!entry) return null;

        const now = Date.now();
        const isStale = now - entry.timestamp > entry.ttl;

        if (isStale && revalidator && !entry.isFetching) {
            entry.isFetching = true;
            revalidator()
                .then(freshData => {
                    this.set(key, freshData, entry.ttl / 60000);
                })
                .catch(err => {
                    console.error(`SWR revalidation failed for ${key}:`, err);
                })
                .finally(() => {
                    if (this.cache.has(key)) {
                        (this.cache.get(key) as CacheEntry<T>).isFetching = false;
                    }
                });
        } else if (isStale && !revalidator) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    clear(): void {
        this.cache.clear();
    }
}

export const dataCache = new StrictCache();

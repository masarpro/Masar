/**
 * In-memory CPM cache with TTL
 *
 * Caches critical path calculation results per project to avoid
 * recalculating on every request. Invalidated when activities or
 * dependencies are modified.
 */

const CPM_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CPM_CACHE_MAX_SIZE = 200;

interface CacheEntry {
	data: unknown;
	timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export function getCachedCPM(projectId: string): unknown | null {
	const entry = cache.get(projectId);
	if (!entry) return null;

	if (Date.now() - entry.timestamp > CPM_CACHE_TTL) {
		cache.delete(projectId);
		return null;
	}

	return entry.data;
}

export function setCPMCache(projectId: string, data: unknown): void {
	// Evict oldest entries if at capacity
	if (cache.size >= CPM_CACHE_MAX_SIZE && !cache.has(projectId)) {
		let oldestKey: string | null = null;
		let oldestTime = Infinity;
		for (const [key, entry] of cache) {
			if (entry.timestamp < oldestTime) {
				oldestTime = entry.timestamp;
				oldestKey = key;
			}
		}
		if (oldestKey) cache.delete(oldestKey);
	}

	cache.set(projectId, { data, timestamp: Date.now() });
}

export function invalidateCPMCache(projectId: string): void {
	cache.delete(projectId);
}

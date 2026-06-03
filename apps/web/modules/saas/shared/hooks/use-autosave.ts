"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AutosaveStatus =
	| "waiting" // النموذج جديد ولم يصل بعد للحد الأدنى من البيانات
	| "idle" // محفوظ، لا تغييرات معلّقة
	| "dirty" // تغييرات معلّقة (debounce قيد العد)
	| "saving" // طلب قيد التنفيذ
	| "saved" // نجح آخر حفظ
	| "error" // فشل آخر حفظ بعد retries
	| "conflict"; // تعارض من جلسة أخرى

export interface AutosaveState {
	status: AutosaveStatus;
	lastSavedAt: Date | null;
	errorMessage: string | null;
	retryCount: number;
}

export interface AutosaveConfig<TSnapshot, TItems> {
	snapshot: TSnapshot;
	items: TItems;
	id: string | undefined;
	enabled: boolean;
	isReadyForCreate: (snapshot: TSnapshot, items: TItems) => boolean;
	createDraft: (snapshot: TSnapshot, items: TItems) => Promise<{ id: string }>;
	updateHeader: (id: string, snapshot: TSnapshot) => Promise<void>;
	updateItems: (id: string, items: TItems) => Promise<void>;
	hasHeaderChanged?: (current: TSnapshot, lastSaved: TSnapshot | null) => boolean;
	hasItemsChanged?: (current: TItems, lastSaved: TItems | null) => boolean;
	onCreated?: (newId: string) => void;
	onSaved?: () => void;
	onConflict?: () => void;
	debounceMs?: number;
	intervalMs?: number;
}

export interface AutosaveHook {
	state: AutosaveState;
	forceSave: () => Promise<void>;
	hasUnsavedChanges: boolean;
}

const DEFAULT_DEBOUNCE_MS = 1500;
const DEFAULT_INTERVAL_MS = 60_000;
const MAX_RETRIES = 3;
const SAVED_DISPLAY_MS = 3000;

function defaultDiff<T>(a: T, b: T | null): boolean {
	if (b === null) return true;
	try {
		return JSON.stringify(a) !== JSON.stringify(b);
	} catch {
		return true;
	}
}

export function useAutosave<TSnapshot, TItems>(
	config: AutosaveConfig<TSnapshot, TItems>,
): AutosaveHook {
	const {
		snapshot,
		items,
		id,
		enabled,
		isReadyForCreate,
		createDraft,
		updateHeader,
		updateItems,
		hasHeaderChanged = defaultDiff,
		hasItemsChanged = defaultDiff,
		onCreated,
		onSaved,
		onConflict,
		debounceMs = DEFAULT_DEBOUNCE_MS,
		intervalMs = DEFAULT_INTERVAL_MS,
	} = config;

	const [state, setState] = useState<AutosaveState>({
		status: "idle",
		lastSavedAt: null,
		errorMessage: null,
		retryCount: 0,
	});

	// مراجع لتجنب stale closures
	const snapshotRef = useRef(snapshot);
	const itemsRef = useRef(items);
	const idRef = useRef(id);
	const enabledRef = useRef(enabled);
	const lastSavedSnapshotRef = useRef<TSnapshot | null>(null);
	const lastSavedItemsRef = useRef<TItems | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const savedFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inFlightRef = useRef(false);
	const pendingRef = useRef(false);
	const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	snapshotRef.current = snapshot;
	itemsRef.current = items;
	idRef.current = id;
	enabledRef.current = enabled;

	// عند تحميل سجل موجود (edit mode)، نعتبره كحالة "محفوظة"
	useEffect(() => {
		if (id && lastSavedSnapshotRef.current === null) {
			lastSavedSnapshotRef.current = snapshotRef.current;
			lastSavedItemsRef.current = itemsRef.current;
		}
	}, [id]);

	const hasUnsavedChanges = useMemo(() => {
		if (!enabled) return false;
		if (!idRef.current && !isReadyForCreate(snapshot, items)) return false;
		const headerChanged = hasHeaderChanged(snapshot, lastSavedSnapshotRef.current);
		const itemsChanged = hasItemsChanged(items, lastSavedItemsRef.current);
		return headerChanged || itemsChanged;
	}, [snapshot, items, enabled, isReadyForCreate, hasHeaderChanged, hasItemsChanged]);

	const performSave = useCallback(async (): Promise<void> => {
		if (!enabledRef.current) return;

		// Single-flight: إذا هناك طلب قيد التنفيذ، علّم أن هناك آخر ينتظر
		if (inFlightRef.current) {
			pendingRef.current = true;
			return;
		}

		const currentSnapshot = snapshotRef.current;
		const currentItems = itemsRef.current;
		const currentId = idRef.current;

		// Lazy create: لا نُنشئ سجل حتى يتوفر الحد الأدنى
		if (!currentId && !isReadyForCreate(currentSnapshot, currentItems)) {
			setState((s) => (s.status === "waiting" ? s : { ...s, status: "waiting" }));
			return;
		}

		// تحقّق أن هناك تغييرات فعلاً
		const headerChanged = hasHeaderChanged(currentSnapshot, lastSavedSnapshotRef.current);
		const itemsChanged = hasItemsChanged(currentItems, lastSavedItemsRef.current);
		if (currentId && !headerChanged && !itemsChanged) {
			return;
		}

		// إلغاء أي طلب سابق
		if (abortRef.current) {
			abortRef.current.abort();
		}
		const controller = new AbortController();
		abortRef.current = controller;

		inFlightRef.current = true;
		setState((s) => ({ ...s, status: "saving", errorMessage: null }));

		try {
			if (!currentId) {
				const created = await createDraft(currentSnapshot, currentItems);
				if (controller.signal.aborted) return;
				idRef.current = created.id;
				lastSavedSnapshotRef.current = currentSnapshot;
				lastSavedItemsRef.current = currentItems;
				onCreated?.(created.id);
			} else {
				// تحديث header فقط إذا تغيّر
				if (headerChanged) {
					await updateHeader(currentId, currentSnapshot);
					if (controller.signal.aborted) return;
				}
				// تحديث items فقط إذا تغيّرت (لأنها ثقيلة — delete+create)
				if (itemsChanged) {
					await updateItems(currentId, currentItems);
					if (controller.signal.aborted) return;
				}
				lastSavedSnapshotRef.current = currentSnapshot;
				lastSavedItemsRef.current = currentItems;
			}

			onSaved?.();
			setState({
				status: "saved",
				lastSavedAt: new Date(),
				errorMessage: null,
				retryCount: 0,
			});

			// بعد 3s، عُد إلى idle (إلا إذا حدثت تغييرات جديدة)
			if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
			savedFadeTimerRef.current = setTimeout(() => {
				setState((s) => (s.status === "saved" ? { ...s, status: "idle" } : s));
			}, SAVED_DISPLAY_MS);
		} catch (err: unknown) {
			if (controller.signal.aborted) return;
			const error = err as { code?: string; message?: string; name?: string };
			if (error?.name === "AbortError") return;

			// تعارض من جلسة أخرى
			if (error?.code === "CONFLICT") {
				setState((s) => ({
					...s,
					status: "conflict",
					errorMessage: error?.message ?? null,
				}));
				onConflict?.();
				return;
			}

			// Retry مع exponential backoff
			setState((s) => {
				const nextRetry = s.retryCount + 1;
				if (nextRetry < MAX_RETRIES) {
					const delay = 1000 * 2 ** (nextRetry - 1); // 1s, 2s, 4s
					if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
					retryTimerRef.current = setTimeout(() => {
						void performSave();
					}, delay);
					return { ...s, status: "saving", retryCount: nextRetry };
				}
				return {
					...s,
					status: "error",
					errorMessage: error?.message ?? "Save failed",
					retryCount: nextRetry,
				};
			});
		} finally {
			inFlightRef.current = false;
			if (pendingRef.current) {
				pendingRef.current = false;
				// طلب جديد تجمّع أثناء التنفيذ — نطلقه الآن
				void performSave();
			}
		}
	}, [
		isReadyForCreate,
		createDraft,
		updateHeader,
		updateItems,
		hasHeaderChanged,
		hasItemsChanged,
		onCreated,
		onSaved,
		onConflict,
	]);

	// مراقبة التغييرات → debounce
	useEffect(() => {
		if (!enabled) return;
		if (state.status === "conflict") return;
		if (!hasUnsavedChanges) {
			// تنظيف لو لا تغييرات
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
				debounceTimerRef.current = null;
			}
			return;
		}

		// إذا الحالة "waiting"، تحقق هل أصبحنا جاهزين
		if (!idRef.current && !isReadyForCreate(snapshot, items)) {
			setState((s) => (s.status === "waiting" ? s : { ...s, status: "waiting" }));
			return;
		}

		setState((s) =>
			s.status === "dirty" || s.status === "saving" || s.status === "error"
				? s
				: { ...s, status: "dirty" },
		);

		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		debounceTimerRef.current = setTimeout(() => {
			void performSave();
		}, debounceMs);

		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		};
	}, [snapshot, items, enabled, hasUnsavedChanges, isReadyForCreate, performSave, debounceMs, state.status]);

	// Interval احتياطي كل 60s إذا كانت dirty
	useEffect(() => {
		if (!enabled) return;
		const interval = setInterval(() => {
			if (hasUnsavedChanges && !inFlightRef.current) {
				void performSave();
			}
		}, intervalMs);
		return () => clearInterval(interval);
	}, [enabled, hasUnsavedChanges, performSave, intervalMs]);

	// Immediate save على blur/hidden
	useEffect(() => {
		if (!enabled) return;
		const handleHidden = () => {
			if (document.visibilityState === "hidden" && hasUnsavedChanges) {
				if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
				void performSave();
			}
		};
		const handleBlur = () => {
			if (hasUnsavedChanges) {
				if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
				void performSave();
			}
		};
		document.addEventListener("visibilitychange", handleHidden);
		window.addEventListener("blur", handleBlur);
		return () => {
			document.removeEventListener("visibilitychange", handleHidden);
			window.removeEventListener("blur", handleBlur);
		};
	}, [enabled, hasUnsavedChanges, performSave]);

	// beforeunload guard
	useEffect(() => {
		if (!enabled) return;
		const handler = (e: BeforeUnloadEvent) => {
			if (
				hasUnsavedChanges ||
				state.status === "saving" ||
				state.status === "error" ||
				state.status === "dirty"
			) {
				e.preventDefault();
				e.returnValue = "";
				return "";
			}
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [enabled, hasUnsavedChanges, state.status]);

	// إعادة المحاولة عند عودة الاتصال
	useEffect(() => {
		if (!enabled) return;
		const handler = () => {
			if (state.status === "error" && hasUnsavedChanges) {
				setState((s) => ({ ...s, retryCount: 0 }));
				void performSave();
			}
		};
		window.addEventListener("online", handler);
		return () => window.removeEventListener("online", handler);
	}, [enabled, hasUnsavedChanges, performSave, state.status]);

	// Cleanup عند unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
			if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
			if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
			if (abortRef.current) abortRef.current.abort();
		};
	}, []);

	const forceSave = useCallback(async () => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}
		if (retryTimerRef.current) {
			clearTimeout(retryTimerRef.current);
			retryTimerRef.current = null;
		}
		setState((s) => ({ ...s, retryCount: 0 }));
		await performSave();
	}, [performSave]);

	return { state, forceSave, hasUnsavedChanges };
}

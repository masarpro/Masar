// ═══════════════════════════════════════════════════════════════════════════
// نظام إدارة الفضلات (Waste Inventory Management)
// ═══════════════════════════════════════════════════════════════════════════

import type { StoredRemnant, WasteInventory, Remnant } from './types';
import { REBAR_SPECIFICATIONS } from './saudi-rebar-specs';

/**
 * البحث عن فضلات قابلة للاستخدام
 */
export function findMatchingRemnants(
	inventory: WasteInventory,
	required: { diameter: number; minLength: number; quantity: number }
): StoredRemnant[] {
	return inventory.remnants
		.filter(r =>
			r.diameter === required.diameter &&
			r.length >= required.minLength &&
			r.status === 'available'
		)
		.sort((a, b) => a.length - b.length) // الأقصر أولاً (لتقليل الهدر)
		.slice(0, required.quantity);
}

/**
 * إضافة فضلات جديدة للمخزون
 */
export function addRemnantsToInventory(
	inventory: WasteInventory,
	remnants: Remnant[],
	source: string
): void {
	const now = new Date();

	remnants.forEach(remnant => {
		// البحث عن فضلة موجودة بنفس المواصفات
		const existing = inventory.remnants.find(r =>
			r.diameter === remnant.diameter &&
			Math.abs(r.length - remnant.length) < 0.01 &&
			r.status === 'available'
		);

		if (existing) {
			existing.quantity += remnant.quantity;
		} else {
			inventory.remnants.push({
				id: `remnant-${inventory.projectId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				diameter: remnant.diameter,
				length: remnant.length,
				quantity: remnant.quantity,
				source,
				dateAdded: now,
				status: 'available',
			});
		}
	});

	inventory.lastUpdated = now;
}

/**
 * حجز فضلة لاستخدام معين
 */
export function reserveRemnant(
	inventory: WasteInventory,
	remnantId: string,
	reservedFor: string
): boolean {
	const remnant = inventory.remnants.find(r => r.id === remnantId);

	if (!remnant || remnant.status !== 'available') {
		return false;
	}

	remnant.status = 'reserved';
	remnant.reservedFor = reservedFor;
	inventory.lastUpdated = new Date();

	return true;
}

/**
 * إلغاء حجز فضلة
 */
export function releaseRemnant(
	inventory: WasteInventory,
	remnantId: string
): boolean {
	const remnant = inventory.remnants.find(r => r.id === remnantId);

	if (!remnant || remnant.status !== 'reserved') {
		return false;
	}

	remnant.status = 'available';
	remnant.reservedFor = undefined;
	inventory.lastUpdated = new Date();

	return true;
}

/**
 * استخدام فضلة (حذفها من المخزون)
 */
export function useRemnant(
	inventory: WasteInventory,
	remnantId: string,
	quantity: number = 1
): boolean {
	const remnant = inventory.remnants.find(r => r.id === remnantId);

	if (!remnant) {
		return false;
	}

	if (remnant.quantity > quantity) {
		remnant.quantity -= quantity;
	} else {
		// حذف الفضلة إذا استخدمنا كل الكمية
		const index = inventory.remnants.findIndex(r => r.id === remnantId);
		if (index !== -1) {
			inventory.remnants.splice(index, 1);
		}
	}

	inventory.lastUpdated = new Date();
	return true;
}

/**
 * الحصول على إحصائيات المخزون
 */
export function getInventoryStats(inventory: WasteInventory): {
	totalRemnants: number;
	totalWeight: number;
	byDiameter: Record<number, { count: number; weight: number }>;
	byStatus: { available: number; reserved: number; used: number };
} {
	const stats = {
		totalRemnants: 0,
		totalWeight: 0,
		byDiameter: {} as Record<number, { count: number; weight: number }>,
		byStatus: { available: 0, reserved: 0, used: 0 },
	};

	inventory.remnants.forEach(remnant => {
		stats.totalRemnants += remnant.quantity;

		const weightPerMeter = REBAR_SPECIFICATIONS.weightPerMeter[remnant.diameter] || 0;
		const remnantWeight = remnant.length * remnant.quantity * weightPerMeter;
		stats.totalWeight += remnantWeight;

		// حسب القطر
		if (!stats.byDiameter[remnant.diameter]) {
			stats.byDiameter[remnant.diameter] = { count: 0, weight: 0 };
		}
		stats.byDiameter[remnant.diameter].count += remnant.quantity;
		stats.byDiameter[remnant.diameter].weight += remnantWeight;

		// حسب الحالة
		if (remnant.status === 'available') stats.byStatus.available += remnant.quantity;
		else if (remnant.status === 'reserved') stats.byStatus.reserved += remnant.quantity;
		else if (remnant.status === 'used') stats.byStatus.used += remnant.quantity;
	});

	return stats;
}

/**
 * تنظيف الفضلات القديمة (أكثر من X يوم)
 */
export function cleanOldRemnants(
	inventory: WasteInventory,
	maxAgeDays: number = 90
): number {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

	let removedCount = 0;

	inventory.remnants = inventory.remnants.filter(remnant => {
		if (remnant.dateAdded < cutoffDate && remnant.status === 'available') {
			removedCount += remnant.quantity;
			return false;
		}
		return true;
	});

	inventory.lastUpdated = new Date();
	return removedCount;
}

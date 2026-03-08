import type { MEPDerivedItem, MEPMergedItem } from "../types/mep";

interface SavedMEPItem {
	id: string;
	category: string;
	subCategory: string;
	itemType: string | null;
	name: string;
	floorId: string | null;
	floorName: string | null;
	roomId: string | null;
	roomName: string | null;
	scope: string;
	quantity: number;
	unit: string;
	dataSource: string;
	isEnabled: boolean;
	materialPrice: number;
	laborPrice: number;
	wastagePercent: number;
	materialCost: number;
	laborCost: number;
	totalCost: number;
	groupKey: string | null;
	sourceFormula: string | null;
	calculationData: Record<string, any> | null;
	specData: Record<string, any> | null;
	qualityLevel: string | null;
	[key: string]: any;
}

/**
 * دمج البنود المشتقة من المحرك مع البنود المحفوظة في قاعدة البيانات
 *
 * القواعد:
 * 1. بند في المشتق والمحفوظ → استخدم المحفوظ (المستخدم قد عدّل)
 * 2. بند في المشتق فقط → إضافة كجديد
 * 3. بند في المحفوظ فقط (manual) → إبقاء كبند يدوي
 *
 * مفتاح المطابقة: category + subCategory + itemType + floorId + roomId
 */
export function mergeMEPQuantities(
	derived: MEPDerivedItem[],
	saved: SavedMEPItem[],
): MEPMergedItem[] {
	const merged: MEPMergedItem[] = [];
	const matchedSavedIds = new Set<string>();

	for (const d of derived) {
		const matchKey = `${d.category}|${d.subCategory}|${d.itemType}|${d.floorId}|${d.roomId}`;

		const savedMatch = saved.find((s) => {
			const sKey = `${s.category}|${s.subCategory}|${s.itemType}|${s.floorId}|${s.roomId}`;
			return sKey === matchKey && !matchedSavedIds.has(s.id);
		});

		if (savedMatch) {
			matchedSavedIds.add(savedMatch.id);
			const isManualOverride =
				savedMatch.dataSource === "manual" &&
				Math.abs(Number(savedMatch.quantity) - d.quantity) > 0.01;

			merged.push({
				...d,
				id: savedMatch.id,
				isNew: false,
				isSaved: true,
				isManualOverride,
				isEnabled: savedMatch.isEnabled,
				savedQuantity: Number(savedMatch.quantity),
				derivedQuantity: d.quantity,
				quantity: Number(savedMatch.quantity), // استخدم المحفوظ
				materialPrice:
					Number(savedMatch.materialPrice) || d.materialPrice,
				laborPrice:
					Number(savedMatch.laborPrice) || d.laborPrice,
				totalCost: Number(savedMatch.totalCost),
				materialCost: Number(savedMatch.materialCost),
				laborCost: Number(savedMatch.laborCost),
				dataSource: savedMatch.dataSource as
					| "auto"
					| "manual"
					| "estimated",
			});
		} else {
			const wastageMultiplier = 1 + d.wastagePercent / 100;
			const materialCost =
				d.quantity * d.materialPrice * wastageMultiplier;
			const laborCost = d.quantity * d.laborPrice;

			merged.push({
				...d,
				id: undefined,
				isNew: true,
				isSaved: false,
				isManualOverride: false,
				isEnabled: true,
				derivedQuantity: d.quantity,
				totalCost: materialCost + laborCost,
				materialCost,
				laborCost,
				dataSource: "auto",
			});
		}
	}

	// بنود محفوظة يدوية لم تتطابق مع المشتق
	for (const s of saved) {
		if (!matchedSavedIds.has(s.id) && s.dataSource === "manual") {
			merged.push({
				category: s.category as MEPDerivedItem["category"],
				subCategory: s.subCategory,
				itemType: s.itemType || "",
				name: s.name,
				floorId: s.floorId,
				floorName: s.floorName,
				roomId: s.roomId,
				roomName: s.roomName,
				scope: s.scope as MEPDerivedItem["scope"],
				groupKey: s.groupKey || "",
				quantity: Number(s.quantity),
				unit: s.unit,
				materialPrice: Number(s.materialPrice),
				laborPrice: Number(s.laborPrice),
				wastagePercent: Number(s.wastagePercent),
				calculationData: s.calculationData || {},
				sourceFormula: s.sourceFormula || "",
				specData: s.specData || {},
				qualityLevel: (s.qualityLevel || "standard") as
					| "economy"
					| "standard"
					| "premium",
				id: s.id,
				isNew: false,
				isSaved: true,
				isManualOverride: true,
				isEnabled: s.isEnabled,
				totalCost: Number(s.totalCost),
				materialCost: Number(s.materialCost),
				laborCost: Number(s.laborCost),
				dataSource: "manual",
			});
		}
	}

	return merged;
}

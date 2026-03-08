/**
 * محرك اشتقاق الأعمال الكهروميكانيكية (MEP Derivation Engine)
 *
 * يقرأ buildingConfig (نفس بيانات قسم التشطيبات) ويولّد قائمة بنود MEP.
 *
 * المدخلات: SmartBuildingConfig + projectType
 * المخرجات: MEPDerivedItem[]
 *
 * خوارزمية العمل:
 * 1. لكل طابق → لكل غرفة → قراءة ROOM_MEP_PROFILES[room.type]
 * 2. حساب: إنارة، أفياش، تكييف، سباكة (حسب نوع الغرفة)
 * 3. تجميع: كيبلات، لوحات، أسلاك (على مستوى الطابق)
 * 4. حساب: مبنى كامل (خزانات، مضخات، تأريض، مصعد، مولد)
 * 5. حساب: خارجي (إنارة، ري، كاميرات)
 * 6. حساب: حريق (حسب نوع المبنى والمساحة)
 */

import type {
	MEPDerivedItem,
	RoomType,
} from "../types/mep";
import type {
	SmartBuildingConfig,
	SmartFloorConfig,
} from "./smart-building-types";
import {
	ROOM_MEP_PROFILES,
	estimateOccupants,
	selectACSize,
	selectSupplyPipeSize,
	selectCableSize,
	selectRefrigerantPipes,
} from "./mep-room-profiles";
import { getMEPDefaultPrice } from "./mep-prices";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function habitableFloors(config: SmartBuildingConfig): SmartFloorConfig[] {
	return config.floors.filter((f) => f.floorType !== "ROOF");
}

function getFloorRooms(floor: SmartFloorConfig) {
	return floor.rooms ?? [];
}

function getFloorRoomsByType(floor: SmartFloorConfig, type: string) {
	return getFloorRooms(floor).filter((r) => r.type === type);
}

function floorMultiplier(floor: SmartFloorConfig): number {
	return floor.isRepeated ? floor.repeatCount : 1;
}

function getTotalBuildingArea(config: SmartBuildingConfig): number {
	return config.floors.reduce(
		(sum, f) => sum + f.area * floorMultiplier(f),
		0,
	);
}

function countAllRoomsByType(
	config: SmartBuildingConfig,
	type: string,
): number {
	let count = 0;
	for (const floor of config.floors) {
		const rooms = getFloorRoomsByType(floor, type);
		count += rooms.length * floorMultiplier(floor);
	}
	return count;
}

function totalFloorCount(config: SmartBuildingConfig): number {
	return config.floors.reduce((sum, f) => sum + floorMultiplier(f), 0);
}

function makeItem(
	partial: Omit<MEPDerivedItem, "qualityLevel"> & {
		qualityLevel?: MEPDerivedItem["qualityLevel"];
	},
): MEPDerivedItem {
	return {
		qualityLevel: "standard",
		...partial,
	};
}

// ═══════════════════════════════════════════════════════════════
// Main Entry
// ═══════════════════════════════════════════════════════════════

export function deriveMEPQuantities(
	config: SmartBuildingConfig,
	projectType: string = "RESIDENTIAL",
): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];

	// ─── 1. الكهرباء ───
	items.push(...deriveElectricalLighting(config));
	items.push(...deriveElectricalOutlets(config));
	items.push(...deriveElectricalCablesAndPanels(config));
	items.push(...deriveEarthing(config));
	items.push(...deriveEmergencyLighting(config, projectType));

	// ─── 2. السباكة ───
	items.push(...derivePlumbingFixtures(config));
	items.push(...derivePlumbingPipes(config));
	items.push(...deriveTanksAndPumps(config));
	items.push(...deriveManholes(config));
	items.push(...deriveHeaters(config));

	// ─── 3. التكييف ───
	items.push(...deriveACUnits(config));
	items.push(...deriveRefrigerantPipes(config));
	items.push(...deriveVentilation(config));

	// ─── 4. الحريق ───
	items.push(...deriveFirefighting(config, projectType));

	// ─── 5. التيار الخفيف ───
	items.push(...deriveLowCurrent(config, projectType));

	// ─── 6. أنظمة خاصة ───
	items.push(...deriveSpecialSystems(config, projectType));

	// ─── 7. خارجي ───
	items.push(...deriveExteriorMEP(config));

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.2: اشتقاق الإنارة
// ═══════════════════════════════════════════════════════════════

function deriveElectricalLighting(
	config: SmartBuildingConfig,
): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];

	for (const floor of config.floors) {
		if (floor.floorType === "ROOF") continue;

		for (const room of getFloorRooms(floor)) {
			const profile = ROOM_MEP_PROFILES[room.type as RoomType];
			if (!profile) continue;

			const area = room.length * room.width;
			if (area <= 0) continue;

			// ─── سبوت لايت ───
			const spotCount = Math.ceil(area / profile.spotLightCoverage);
			const spotPrice = getMEPDefaultPrice("ELECTRICAL", "spot_light");

			items.push(
				makeItem({
					category: "ELECTRICAL",
					subCategory: "lighting",
					itemType: "spot_light",
					name: `سبوت لايت LED - ${room.name || room.type}`,
					floorId: floor.id,
					floorName: floor.name,
					roomId: room.id,
					roomName: room.name || room.type,
					scope: "per_room",
					groupKey: "electrical_lighting",
					quantity: spotCount,
					unit: "نقطة",
					materialPrice: spotPrice.materialPrice,
					laborPrice: spotPrice.laborPrice,
					wastagePercent: spotPrice.wastagePercent,
					calculationData: {
						roomArea: area,
						roomType: room.type,
						coveragePerSpot: profile.spotLightCoverage,
						luxLevel: profile.luxLevel,
					},
					sourceFormula: `مساحة(${area.toFixed(1)}م²) ÷ تغطية(${profile.spotLightCoverage}م²) = ${spotCount} نقطة`,
					specData: {
						wattage: "9-12W LED",
						size: '4"',
						wireSize: "1.5mm²",
					},
				}),
			);

			// ─── نجفة (إن وجدت) ───
			if (profile.hasChandelier) {
				const chandelierPrice = getMEPDefaultPrice(
					"ELECTRICAL",
					"chandelier_point",
				);
				items.push(
					makeItem({
						category: "ELECTRICAL",
						subCategory: "lighting",
						itemType: "chandelier_point",
						name: `نقطة نجفة - ${room.name || room.type}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: room.name || room.type,
						scope: "per_room",
						groupKey: "electrical_lighting",
						quantity: 1,
						unit: "نقطة",
						materialPrice: chandelierPrice.materialPrice,
						laborPrice: chandelierPrice.laborPrice,
						wastagePercent: chandelierPrice.wastagePercent,
						calculationData: {
							roomType: room.type,
							reason: "صالة/مجلس يحتاج نجفة",
						},
						sourceFormula: `${room.type} → نقطة نجفة`,
						specData: {
							wireSize: "2.5mm²",
							mountType: "ceiling_plate",
						},
					}),
				);
			}
		}
	}

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.3: اشتقاق الأفياش
// ═══════════════════════════════════════════════════════════════

function deriveElectricalOutlets(
	config: SmartBuildingConfig,
): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];

	for (const floor of config.floors) {
		if (floor.floorType === "ROOF") continue;

		for (const room of getFloorRooms(floor)) {
			const profile = ROOM_MEP_PROFILES[room.type as RoomType];
			if (!profile) continue;

			const roomLabel = room.name || room.type;

			// ─── أفياش عادية 13A ───
			if (profile.outlets13A > 0) {
				const p = getMEPDefaultPrice("ELECTRICAL", "outlet_13a");
				items.push(
					makeItem({
						category: "ELECTRICAL",
						subCategory: "power_outlets",
						itemType: "outlet_13a",
						name: `أفياش 13A مزدوج - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "electrical_power",
						quantity: profile.outlets13A,
						unit: "نقطة",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: {
							roomType: room.type,
							standard: "SBC",
						},
						sourceFormula: `${room.type} → ${profile.outlets13A} أفياش 13A`,
						specData: {
							rating: "13A",
							wireSize: "2.5mm²",
							type: "double",
						},
					}),
				);
			}

			// ─── فيش مكيف 20A ───
			if (profile.outlets20A_AC > 0) {
				const p = getMEPDefaultPrice("ELECTRICAL", "outlet_20a_ac");
				items.push(
					makeItem({
						category: "ELECTRICAL",
						subCategory: "power_outlets",
						itemType: "outlet_20a_ac",
						name: `فيش مكيف 20A - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "electrical_power",
						quantity: profile.outlets20A_AC,
						unit: "نقطة",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: room.type },
						sourceFormula: `${room.type} → فيش مكيف مخصص`,
						specData: {
							rating: "20A",
							wireSize: "4mm²",
							type: "dedicated",
						},
					}),
				);
			}

			// ─── فيش سخان 20A (حمامات) ───
			if (profile.outlets20A_heater > 0) {
				const p = getMEPDefaultPrice("ELECTRICAL", "outlet_20a_heater");
				items.push(
					makeItem({
						category: "ELECTRICAL",
						subCategory: "power_outlets",
						itemType: "outlet_20a_heater",
						name: `فيش سخان 20A - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "electrical_power",
						quantity: profile.outlets20A_heater,
						unit: "نقطة",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: room.type },
						sourceFormula: `حمام → فيش سخان مخصص`,
						specData: { rating: "20A", wireSize: "4mm²" },
					}),
				);
			}

			// ─── فيش فرن 32A (مطبخ) ───
			if (profile.outlets32A_oven > 0) {
				const p = getMEPDefaultPrice("ELECTRICAL", "outlet_32a_oven");
				items.push(
					makeItem({
						category: "ELECTRICAL",
						subCategory: "power_outlets",
						itemType: "outlet_32a_oven",
						name: `فيش فرن كهربائي 32A - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "electrical_power",
						quantity: profile.outlets32A_oven,
						unit: "نقطة",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: room.type },
						sourceFormula: `مطبخ → فيش فرن مخصص`,
						specData: { rating: "32A", wireSize: "6mm²" },
					}),
				);
			}

			// ─── فيش غسالة 20A (غسيل) ───
			if (profile.outlets20A_washer > 0) {
				const p = getMEPDefaultPrice("ELECTRICAL", "outlet_20a_washer");
				items.push(
					makeItem({
						category: "ELECTRICAL",
						subCategory: "power_outlets",
						itemType: "outlet_20a_washer",
						name: `فيش غسالة 20A - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "electrical_power",
						quantity: profile.outlets20A_washer,
						unit: "نقطة",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: room.type },
						sourceFormula: `غسيل → فيش غسالة مخصص`,
						specData: { rating: "20A", wireSize: "4mm²" },
					}),
				);
			}
		}
	}

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.4: اشتقاق الكيبلات واللوحات
// ═══════════════════════════════════════════════════════════════

function deriveElectricalCablesAndPanels(
	config: SmartBuildingConfig,
): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];
	let floorIndex = 0;

	for (const floor of config.floors) {
		if (floor.floorType === "ROOF") continue;

		const rooms = getFloorRooms(floor);
		if (rooms.length === 0) continue;

		// تجميع نقاط الطابق
		let lightingPoints = 0;
		let outlets13A = 0;
		let outlets20A = 0; // مكيفات + سخانات + غسالات
		let outlets32A = 0; // أفران
		let totalACPoints = 0;
		let totalHeaterPoints = 0;

		for (const room of rooms) {
			const profile = ROOM_MEP_PROFILES[room.type as RoomType];
			if (!profile) continue;

			const area = room.length * room.width;
			lightingPoints += Math.ceil(area / profile.spotLightCoverage);
			if (profile.hasChandelier) lightingPoints += 1;
			outlets13A += profile.outlets13A;
			outlets20A +=
				profile.outlets20A_AC +
				profile.outlets20A_heater +
				profile.outlets20A_washer;
			outlets32A += profile.outlets32A_oven;
			totalACPoints += profile.outlets20A_AC;
			totalHeaterPoints += profile.outlets20A_heater;
		}

		// ─── أسلاك الإنارة 1.5mm² ───
		const wire15Length = lightingPoints * 4 * 3; // 4م × 3 أسلاك
		if (wire15Length > 0) {
			const p = getMEPDefaultPrice("ELECTRICAL", "wire_1_5mm");
			items.push(
				makeItem({
					category: "ELECTRICAL",
					subCategory: "cables",
					itemType: "wire_1_5mm",
					name: `أسلاك إنارة 1.5mm² - ${floor.name}`,
					floorId: floor.id,
					floorName: floor.name,
					roomId: null,
					roomName: null,
					scope: "per_floor",
					groupKey: "electrical_cables",
					quantity: Math.ceil(wire15Length),
					unit: "م.ط",
					materialPrice: p.materialPrice,
					laborPrice: p.laborPrice,
					wastagePercent: p.wastagePercent,
					calculationData: {
						lightingPoints,
						avgRunPerPoint: 4,
						conductors: 3,
					},
					sourceFormula: `${lightingPoints} نقطة × 4م × 3 أسلاك = ${Math.ceil(wire15Length)} م.ط`,
					specData: {
						size: "1.5mm²",
						type: "PVC/PVC",
						color: "أحمر+أسود+أخضر/أصفر",
					},
				}),
			);
		}

		// ─── أسلاك أفياش 2.5mm² ───
		const wire25Length = outlets13A * 6 * 3; // 6م × 3 أسلاك
		if (wire25Length > 0) {
			const p = getMEPDefaultPrice("ELECTRICAL", "wire_2_5mm");
			items.push(
				makeItem({
					category: "ELECTRICAL",
					subCategory: "cables",
					itemType: "wire_2_5mm",
					name: `أسلاك أفياش 2.5mm² - ${floor.name}`,
					floorId: floor.id,
					floorName: floor.name,
					roomId: null,
					roomName: null,
					scope: "per_floor",
					groupKey: "electrical_cables",
					quantity: Math.ceil(wire25Length),
					unit: "م.ط",
					materialPrice: p.materialPrice,
					laborPrice: p.laborPrice,
					wastagePercent: p.wastagePercent,
					calculationData: {
						outlets13A,
						avgRunPerPoint: 6,
						conductors: 3,
					},
					sourceFormula: `${outlets13A} فيش × 6م × 3 أسلاك = ${Math.ceil(wire25Length)} م.ط`,
					specData: { size: "2.5mm²", type: "PVC/PVC" },
				}),
			);
		}

		// ─── أسلاك مكيفات/سخانات 4mm² ───
		const wire4Length = outlets20A * 10 * 3; // 10م × 3 أسلاك
		if (wire4Length > 0) {
			const p = getMEPDefaultPrice("ELECTRICAL", "wire_4mm");
			items.push(
				makeItem({
					category: "ELECTRICAL",
					subCategory: "cables",
					itemType: "wire_4mm",
					name: `أسلاك 4mm² (مكيفات/سخانات) - ${floor.name}`,
					floorId: floor.id,
					floorName: floor.name,
					roomId: null,
					roomName: null,
					scope: "per_floor",
					groupKey: "electrical_cables",
					quantity: Math.ceil(wire4Length),
					unit: "م.ط",
					materialPrice: p.materialPrice,
					laborPrice: p.laborPrice,
					wastagePercent: p.wastagePercent,
					calculationData: {
						outlets20A,
						avgRunPerPoint: 10,
						conductors: 3,
					},
					sourceFormula: `${outlets20A} نقطة 20A × 10م × 3 أسلاك = ${Math.ceil(wire4Length)} م.ط`,
					specData: { size: "4mm²", type: "PVC/PVC" },
				}),
			);
		}

		// ─── أسلاك أفران 6mm² ───
		const wire6Length = outlets32A * 12 * 3; // 12م × 3 أسلاك
		if (wire6Length > 0) {
			const p = getMEPDefaultPrice("ELECTRICAL", "wire_6mm");
			items.push(
				makeItem({
					category: "ELECTRICAL",
					subCategory: "cables",
					itemType: "wire_6mm",
					name: `أسلاك 6mm² (أفران) - ${floor.name}`,
					floorId: floor.id,
					floorName: floor.name,
					roomId: null,
					roomName: null,
					scope: "per_floor",
					groupKey: "electrical_cables",
					quantity: Math.ceil(wire6Length),
					unit: "م.ط",
					materialPrice: p.materialPrice,
					laborPrice: p.laborPrice,
					wastagePercent: p.wastagePercent,
					calculationData: {
						outlets32A,
						avgRunPerPoint: 12,
						conductors: 3,
					},
					sourceFormula: `${outlets32A} فرن × 12م × 3 أسلاك = ${Math.ceil(wire6Length)} م.ط`,
					specData: { size: "6mm²", type: "PVC/PVC" },
				}),
			);
		}

		// ─── حساب الدوائر واللوحة الفرعية ───
		const lightingCircuits = Math.ceil(lightingPoints / 8);
		const outletCircuits = Math.ceil(outlets13A / 6);
		const acCircuits = totalACPoints; // كل مكيف دائرة
		const heaterCircuits = totalHeaterPoints; // كل سخان دائرة
		const ovenCircuits = outlets32A; // كل فرن دائرة

		const singlePoleBreakers =
			lightingCircuits * 1 + outletCircuits * 1;
		const doublePoleBreakers =
			acCircuits * 2 + heaterCircuits * 2 + ovenCircuits * 2;
		const totalPoles = singlePoleBreakers + doublePoleBreakers;
		const polesWithSpare = Math.ceil(totalPoles * 1.3); // 30% احتياطي

		// اختيار حجم اللوحة
		let panelType: string;
		let panelLabel: string;
		if (polesWithSpare <= 12) {
			panelType = "panel_12way";
			panelLabel = "12 قطب";
		} else if (polesWithSpare <= 24) {
			panelType = "panel_24way";
			panelLabel = "24 قطب";
		} else {
			panelType = "panel_36way";
			panelLabel = "36 قطب";
		}

		const panelPrice = getMEPDefaultPrice("ELECTRICAL", panelType);
		items.push(
			makeItem({
				category: "ELECTRICAL",
				subCategory: "panels",
				itemType: panelType,
				name: `لوحة فرعية ${panelLabel} - ${floor.name}`,
				floorId: floor.id,
				floorName: floor.name,
				roomId: null,
				roomName: null,
				scope: "per_floor",
				groupKey: "electrical_panels",
				quantity: 1,
				unit: "عدد",
				materialPrice: panelPrice.materialPrice,
				laborPrice: panelPrice.laborPrice,
				wastagePercent: panelPrice.wastagePercent,
				calculationData: {
					lightingCircuits,
					outletCircuits,
					acCircuits,
					heaterCircuits,
					ovenCircuits,
					totalPoles,
					polesWithSpare,
				},
				sourceFormula: `إنارة(${lightingCircuits}) + أفياش(${outletCircuits}) + مكيفات(${acCircuits}) + سخانات(${heaterCircuits}) + أفران(${ovenCircuits}) = ${totalPoles} قطب + 30% = ${polesWithSpare} → ${panelLabel}`,
				specData: {
					type: panelType,
					mainBreaker: "63A",
					brand: "ABB/Schneider",
				},
			}),
		);

		// ─── كيبل تغذية الطابق ───
		// تقدير الحمل: (إنارة × 0.1KW) + (أفياش × 0.5KW) + (مكيفات × 2KW) + (سخانات × 2KW) + (أفران × 4KW)
		const estimatedLoadKW =
			lightingPoints * 0.1 +
			outlets13A * 0.5 +
			totalACPoints * 2 +
			totalHeaterPoints * 2 +
			outlets32A * 4;

		const cableDistance =
			10 + floorIndex * (floor.height || 3) + 5; // عداد→لوحة + ارتفاع + فائض
		const cableSpec = selectCableSize(estimatedLoadKW);

		// نختار أقرب كيبل من الأسعار المتوفرة
		let cableItemType = "cable_4x16";
		if (cableSpec.size.includes("25")) cableItemType = "cable_4x25";
		else if (cableSpec.size.includes("35")) cableItemType = "cable_4x35";
		else if (
			cableSpec.size.includes("50") ||
			cableSpec.size.includes("70") ||
			cableSpec.size.includes("95") ||
			cableSpec.size.includes("120")
		)
			cableItemType = "cable_4x50";

		const cablePrice = getMEPDefaultPrice("ELECTRICAL", cableItemType);
		items.push(
			makeItem({
				category: "ELECTRICAL",
				subCategory: "cables",
				itemType: cableItemType,
				name: `كيبل تغذية ${cableSpec.size} - ${floor.name}`,
				floorId: floor.id,
				floorName: floor.name,
				roomId: null,
				roomName: null,
				scope: "per_floor",
				groupKey: "electrical_cables",
				quantity: Math.ceil(cableDistance),
				unit: "م.ط",
				materialPrice: cablePrice.materialPrice,
				laborPrice: cablePrice.laborPrice,
				wastagePercent: cablePrice.wastagePercent,
				calculationData: {
					estimatedLoadKW: Math.round(estimatedLoadKW * 10) / 10,
					cableDistance,
					ampacity: cableSpec.ampacity,
				},
				sourceFormula: `حمل(${estimatedLoadKW.toFixed(1)}KW) → ${cableSpec.size} × ${Math.ceil(cableDistance)}م`,
				specData: {
					size: cableSpec.size,
					ampacity: cableSpec.ampacity,
					type: "XLPE/SWA",
				},
			}),
		);

		floorIndex++;
	}

	// ─── لوحة رئيسية للمبنى ───
	const mainPanelPrice = getMEPDefaultPrice("ELECTRICAL", "main_panel");
	items.push(
		makeItem({
			category: "ELECTRICAL",
			subCategory: "panels",
			itemType: "main_panel",
			name: "لوحة توزيع رئيسية",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "electrical_panels",
			quantity: 1,
			unit: "عدد",
			materialPrice: mainPanelPrice.materialPrice,
			laborPrice: mainPanelPrice.laborPrice,
			wastagePercent: mainPanelPrice.wastagePercent,
			calculationData: {
				totalFloors: habitableFloors(config).length,
			},
			sourceFormula: "لوحة رئيسية واحدة للمبنى",
			specData: {
				type: "main_distribution",
				mainBreaker: "100-200A",
				brand: "ABB/Schneider",
			},
		}),
	);

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.4b: التأريض
// ═══════════════════════════════════════════════════════════════

function deriveEarthing(config: SmartBuildingConfig): MEPDerivedItem[] {
	const p = getMEPDefaultPrice("ELECTRICAL", "earthing_system");
	return [
		makeItem({
			category: "ELECTRICAL",
			subCategory: "earthing",
			itemType: "earthing_system",
			name: "نظام تأريض كامل",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "electrical_earthing",
			quantity: 1,
			unit: "نظام",
			materialPrice: p.materialPrice,
			laborPrice: p.laborPrice,
			wastagePercent: p.wastagePercent,
			calculationData: {
				buildingArea: getTotalBuildingArea(config),
			},
			sourceFormula: "نظام تأريض واحد للمبنى",
			specData: {
				type: "copper_rod",
				rodCount: 2,
				resistance: "<5Ω",
			},
		}),
	];
}

// ═══════════════════════════════════════════════════════════════
// 3.4c: إنارة الطوارئ
// ═══════════════════════════════════════════════════════════════

function deriveEmergencyLighting(
	config: SmartBuildingConfig,
	projectType: string,
): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];
	const floors = habitableFloors(config);
	const numFloors = totalFloorCount(config);

	// سكني < 3 طوابق: لا يحتاج إنارة طوارئ
	if (projectType === "RESIDENTIAL" && numFloors < 3) return items;

	for (const floor of floors) {
		// إنارة طوارئ: 1 لكل 100 م² (حد أدنى 2 لكل طابق)
		const emergencyCount = Math.max(2, Math.ceil(floor.area / 100));
		const ep = getMEPDefaultPrice("ELECTRICAL", "emergency_light");

		items.push(
			makeItem({
				category: "ELECTRICAL",
				subCategory: "emergency",
				itemType: "emergency_light",
				name: `إنارة طوارئ - ${floor.name}`,
				floorId: floor.id,
				floorName: floor.name,
				roomId: null,
				roomName: null,
				scope: "per_floor",
				groupKey: "electrical_emergency",
				quantity: emergencyCount,
				unit: "نقطة",
				materialPrice: ep.materialPrice,
				laborPrice: ep.laborPrice,
				wastagePercent: ep.wastagePercent,
				calculationData: {
					floorArea: floor.area,
					coveragePerUnit: 100,
				},
				sourceFormula: `مساحة(${floor.area}م²) ÷ 100 = ${emergencyCount} نقطة (حد أدنى 2)`,
				specData: {
					type: "LED emergency",
					battery: "3h",
				},
			}),
		);

		// لافتات خروج: 1 لكل مخرج (تقدير: 2 لكل طابق)
		const exitPrice = getMEPDefaultPrice("ELECTRICAL", "exit_sign");
		items.push(
			makeItem({
				category: "ELECTRICAL",
				subCategory: "emergency",
				itemType: "exit_sign",
				name: `لافتات خروج - ${floor.name}`,
				floorId: floor.id,
				floorName: floor.name,
				roomId: null,
				roomName: null,
				scope: "per_floor",
				groupKey: "electrical_emergency",
				quantity: 2,
				unit: "نقطة",
				materialPrice: exitPrice.materialPrice,
				laborPrice: exitPrice.laborPrice,
				wastagePercent: exitPrice.wastagePercent,
				calculationData: { exitsPerFloor: 2 },
				sourceFormula: "2 لافتة خروج لكل طابق",
				specData: { type: "illuminated_exit", battery: "3h" },
			}),
		);
	}

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.5: اشتقاق السباكة — الأجهزة الصحية
// ═══════════════════════════════════════════════════════════════

function derivePlumbingFixtures(
	config: SmartBuildingConfig,
): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];

	for (const floor of config.floors) {
		if (floor.floorType === "ROOF") continue;

		for (const room of getFloorRooms(floor)) {
			const profile = ROOM_MEP_PROFILES[room.type as RoomType];
			if (!profile) continue;

			const roomLabel = room.name || room.type;
			const fixtures = profile.plumbingFixtures;

			// مغسلة
			if (fixtures.washbasin > 0) {
				const p = getMEPDefaultPrice("PLUMBING", "washbasin_set");
				items.push(
					makeItem({
						category: "PLUMBING",
						subCategory: "fixtures",
						itemType: "washbasin_set",
						name: `مغسلة - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "plumbing_fixtures",
						quantity: fixtures.washbasin,
						unit: "عدد",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: room.type },
						sourceFormula: `${room.type} → ${fixtures.washbasin} مغسلة`,
						specData: { type: "pedestal", mixer: "single_lever" },
					}),
				);
			}

			// مرحاض
			if (fixtures.wc > 0) {
				const p = getMEPDefaultPrice("PLUMBING", "wc_set");
				items.push(
					makeItem({
						category: "PLUMBING",
						subCategory: "fixtures",
						itemType: "wc_set",
						name: `طقم مرحاض - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "plumbing_fixtures",
						quantity: fixtures.wc,
						unit: "عدد",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: room.type },
						sourceFormula: `${room.type} → ${fixtures.wc} مرحاض`,
						specData: { type: "siphonic", flush: "dual_flush" },
					}),
				);
			}

			// دش
			if (fixtures.shower > 0) {
				const p = getMEPDefaultPrice("PLUMBING", "shower_mixer");
				items.push(
					makeItem({
						category: "PLUMBING",
						subCategory: "fixtures",
						itemType: "shower_mixer",
						name: `خلاط دش - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "plumbing_fixtures",
						quantity: fixtures.shower,
						unit: "عدد",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: room.type },
						sourceFormula: `${room.type} → ${fixtures.shower} دش`,
						specData: { type: "thermostatic", hose: "stainless" },
					}),
				);
			}

			// حوض مطبخ
			if (fixtures.kitchenSink > 0) {
				const p = getMEPDefaultPrice("PLUMBING", "kitchen_sink");
				items.push(
					makeItem({
						category: "PLUMBING",
						subCategory: "fixtures",
						itemType: "kitchen_sink",
						name: `حوض مطبخ - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "plumbing_fixtures",
						quantity: fixtures.kitchenSink,
						unit: "عدد",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: room.type },
						sourceFormula: `مطبخ → ${fixtures.kitchenSink} حوض`,
						specData: { type: "double_bowl", material: "stainless" },
					}),
				);
			}

			// صفاية أرضية (لكل حمام ومطبخ وغسيل)
			if (profile.hasDrainage) {
				const p = getMEPDefaultPrice("PLUMBING", "floor_drain");
				items.push(
					makeItem({
						category: "PLUMBING",
						subCategory: "fixtures",
						itemType: "floor_drain",
						name: `صفاية أرضية - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "plumbing_fixtures",
						quantity: 1,
						unit: "عدد",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: room.type },
						sourceFormula: `${room.type} → صفاية أرضية`,
						specData: { size: "100mm", material: "stainless_steel" },
					}),
				);
			}
		}
	}

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.5b: المواسير
// ═══════════════════════════════════════════════════════════════

function derivePlumbingPipes(config: SmartBuildingConfig): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];

	// تجميع إحصائيات المبنى
	let totalSupplyPoints = 0;
	let totalDrainPoints50 = 0; // مغاسل + دشات
	let totalDrainPoints100 = 0; // مراحيض
	let totalFU = 0;

	for (const floor of config.floors) {
		if (floor.floorType === "ROOF") continue;
		const mult = floorMultiplier(floor);

		for (const room of getFloorRooms(floor)) {
			const profile = ROOM_MEP_PROFILES[room.type as RoomType];
			if (!profile) continue;

			if (profile.hasWaterSupply) {
				totalSupplyPoints += mult;
				totalFU += profile.fixtureUnits * mult;
			}
			if (profile.hasDrainage) {
				// مغاسل + دشات = صرف 50mm
				totalDrainPoints50 +=
					(profile.plumbingFixtures.washbasin +
						profile.plumbingFixtures.shower +
						profile.plumbingFixtures.kitchenSink) *
					mult;
				// مراحيض = صرف 100mm
				totalDrainPoints100 += profile.plumbingFixtures.wc * mult;
			}
		}
	}

	// ─── تغذية بارد PPR 20mm ───
	if (totalSupplyPoints > 0) {
		const coldLength = totalSupplyPoints * 5;
		const p = getMEPDefaultPrice("PLUMBING", "ppr_20mm");
		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "pipes",
				itemType: "ppr_20mm",
				name: "مواسير تغذية بارد PPR 20mm",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_pipes",
				quantity: Math.ceil(coldLength),
				unit: "م.ط",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: { supplyPoints: totalSupplyPoints, avgRun: 5 },
				sourceFormula: `${totalSupplyPoints} نقطة × 5م = ${Math.ceil(coldLength)} م.ط`,
				specData: { material: "PPR", diameter: "20mm", pressure: "PN20" },
			}),
		);

		// ─── تغذية ساخن PPR 20mm ───
		const hotLength = totalSupplyPoints * 5;
		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "pipes",
				itemType: "ppr_20mm",
				name: "مواسير تغذية ساخن PPR 20mm (معزولة)",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_pipes",
				quantity: Math.ceil(hotLength),
				unit: "م.ط",
				materialPrice: p.materialPrice + 2, // إضافة عزل حراري
				laborPrice: p.laborPrice + 1,
				wastagePercent: p.wastagePercent,
				calculationData: {
					supplyPoints: totalSupplyPoints,
					avgRun: 5,
					insulated: true,
				},
				sourceFormula: `${totalSupplyPoints} نقطة × 5م = ${Math.ceil(hotLength)} م.ط (ساخن + عزل)`,
				specData: {
					material: "PPR",
					diameter: "20mm",
					insulation: "thermal_sleeve",
				},
			}),
		);
	}

	// ─── ماسورة رئيسية ───
	if (totalFU > 0) {
		const mainPipe = selectSupplyPipeSize(totalFU);
		let pipeItemType = "ppr_25mm";
		if (mainPipe.size >= 32) pipeItemType = "ppr_32mm";
		const pp = getMEPDefaultPrice("PLUMBING", pipeItemType);

		// الطول: من العداد للسطح تقريباً
		const mainPipeLength =
			config.floors.reduce(
				(s, f) => s + f.height * floorMultiplier(f),
				0,
			) + 10;

		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "pipes",
				itemType: pipeItemType,
				name: `ماسورة تغذية رئيسية ${mainPipe.label}`,
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_pipes",
				quantity: Math.ceil(mainPipeLength),
				unit: "م.ط",
				materialPrice: pp.materialPrice,
				laborPrice: pp.laborPrice,
				wastagePercent: pp.wastagePercent,
				calculationData: {
					totalFU,
					pipeSize: mainPipe.size,
					label: mainPipe.label,
				},
				sourceFormula: `إجمالي FU(${totalFU}) → ${mainPipe.label} × ${Math.ceil(mainPipeLength)}م`,
				specData: {
					material: "PPR",
					diameter: mainPipe.label,
					pressure: "PN20",
				},
			}),
		);
	}

	// ─── صرف 50mm PVC ───
	if (totalDrainPoints50 > 0) {
		const drain50Length = totalDrainPoints50 * 3;
		const p = getMEPDefaultPrice("PLUMBING", "pvc_50mm");
		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "pipes",
				itemType: "pvc_50mm",
				name: "مواسير صرف PVC 50mm (مغاسل/دشات)",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_pipes",
				quantity: Math.ceil(drain50Length),
				unit: "م.ط",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: {
					drainPoints50: totalDrainPoints50,
					avgRun: 3,
				},
				sourceFormula: `${totalDrainPoints50} نقطة × 3م = ${Math.ceil(drain50Length)} م.ط`,
				specData: { material: "uPVC", diameter: "50mm" },
			}),
		);
	}

	// ─── صرف 100mm PVC ───
	if (totalDrainPoints100 > 0) {
		const drain100Length = totalDrainPoints100 * 4;
		const p = getMEPDefaultPrice("PLUMBING", "pvc_100mm");
		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "pipes",
				itemType: "pvc_100mm",
				name: "مواسير صرف PVC 100mm (مراحيض)",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_pipes",
				quantity: Math.ceil(drain100Length),
				unit: "م.ط",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: {
					drainPoints100: totalDrainPoints100,
					avgRun: 4,
				},
				sourceFormula: `${totalDrainPoints100} مرحاض × 4م = ${Math.ceil(drain100Length)} م.ط`,
				specData: { material: "uPVC", diameter: "100mm" },
			}),
		);
	}

	// ─── رايزر صرف (أعمدة عمودية) ───
	const totalBathrooms = countAllRoomsByType(config, "bathroom");
	if (totalBathrooms > 0) {
		const drainColumns = Math.max(1, Math.ceil(totalBathrooms / 3)); // عمود لكل 3 حمامات
		const buildingHeight = config.floors.reduce(
			(s, f) => s + f.height * floorMultiplier(f),
			0,
		);
		const riserLength = drainColumns * (buildingHeight + 2); // +2م فائض
		const p = getMEPDefaultPrice("PLUMBING", "pvc_100mm");

		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "pipes",
				itemType: "pvc_100mm",
				name: "أعمدة صرف رأسية PVC 100mm",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_pipes",
				quantity: Math.ceil(riserLength),
				unit: "م.ط",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: {
					drainColumns,
					buildingHeight,
					totalBathrooms,
				},
				sourceFormula: `${drainColumns} عمود × ${Math.ceil(buildingHeight + 2)}م = ${Math.ceil(riserLength)} م.ط`,
				specData: { material: "uPVC", diameter: "100mm", type: "riser" },
			}),
		);
	}

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.5c: الخزانات والمضخات
// ═══════════════════════════════════════════════════════════════

function deriveTanksAndPumps(config: SmartBuildingConfig): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];
	const floorsForOccupants = config.floors
		.filter((f) => f.floorType !== "ROOF")
		.map((f) => ({
			rooms: getFloorRooms(f).map((r) => ({ type: r.type })),
		}));
	const occupants = estimateOccupants(floorsForOccupants);
	const numFloors = totalFloorCount(config);

	// ─── خزان أرضي ───
	const groundTankM3 = Math.ceil(
		(occupants * 250 * 1.5) / 1000,
	); // 250 لتر/شخص × 1.5 يوم
	const tankPrice = getMEPDefaultPrice("PLUMBING", "tank_fiberglass");
	items.push(
		makeItem({
			category: "PLUMBING",
			subCategory: "tanks",
			itemType: "tank_fiberglass",
			name: "خزان أرضي فايبرجلاس",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "plumbing_tanks",
			quantity: groundTankM3,
			unit: "م³",
			materialPrice: tankPrice.materialPrice,
			laborPrice: tankPrice.laborPrice,
			wastagePercent: tankPrice.wastagePercent,
			calculationData: { occupants, litersPerPerson: 250, days: 1.5 },
			sourceFormula: `${occupants} شخص × 250 لتر × 1.5 يوم ÷ 1000 = ${groundTankM3} م³`,
			specData: { material: "fiberglass", location: "ground" },
		}),
	);

	// ─── خزان علوي ───
	const roofTankM3 = Math.ceil(
		(occupants * 250 * 0.5) / 1000,
	); // نصف يوم
	items.push(
		makeItem({
			category: "PLUMBING",
			subCategory: "tanks",
			itemType: "tank_fiberglass",
			name: "خزان علوي فايبرجلاس",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "plumbing_tanks",
			quantity: roofTankM3,
			unit: "م³",
			materialPrice: tankPrice.materialPrice,
			laborPrice: tankPrice.laborPrice,
			wastagePercent: tankPrice.wastagePercent,
			calculationData: { occupants, litersPerPerson: 250, days: 0.5 },
			sourceFormula: `${occupants} شخص × 250 لتر × 0.5 يوم ÷ 1000 = ${roofTankM3} م³`,
			specData: { material: "fiberglass", location: "roof" },
		}),
	);

	// ─── مضخة رفع ───
	if (numFloors > 1) {
		const pumpType = numFloors > 3 ? "pump_2hp" : "pump_1hp";
		const pumpLabel = numFloors > 3 ? "2 حصان" : "1 حصان";
		const pp = getMEPDefaultPrice("PLUMBING", pumpType);
		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "pumps",
				itemType: pumpType,
				name: `مضخة رفع ${pumpLabel}`,
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_pumps",
				quantity: 1,
				unit: "عدد",
				materialPrice: pp.materialPrice,
				laborPrice: pp.laborPrice,
				wastagePercent: pp.wastagePercent,
				calculationData: { numFloors, pumpSize: pumpLabel },
				sourceFormula: `${numFloors} طابق → مضخة ${pumpLabel}`,
				specData: { type: "centrifugal", power: pumpLabel },
			}),
		);
	}

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.5d: غرف التفتيش
// ═══════════════════════════════════════════════════════════════

function deriveManholes(config: SmartBuildingConfig): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];
	const totalBathrooms = countAllRoomsByType(config, "bathroom");
	const perimeter = config.buildingPerimeter || 0;

	// عدد الغرف = حمامات÷2 + محيط÷15 + 2 (مدخل ومخرج)
	const fromBathrooms = Math.ceil(totalBathrooms / 2);
	const fromPerimeter = perimeter > 0 ? Math.ceil(perimeter / 15) : 1;
	const totalManholes = fromBathrooms + fromPerimeter + 2;

	// نستخدم 60×60 للعدد الأصغر، 80×80 للشبكة الرئيسية
	const small = Math.ceil(totalManholes * 0.6);
	const large = totalManholes - small;

	if (small > 0) {
		const p = getMEPDefaultPrice("PLUMBING", "manhole_60x60");
		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "manholes",
				itemType: "manhole_60x60",
				name: "غرفة تفتيش 60×60 سم",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_manholes",
				quantity: small,
				unit: "عدد",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: {
					totalBathrooms,
					perimeter,
					fromBathrooms,
					fromPerimeter,
				},
				sourceFormula: `(${totalBathrooms}÷2) + (${perimeter || "~"}÷15) + 2 = ${totalManholes} → ${small} صغيرة`,
				specData: { size: "60x60cm", depth: "variable", cover: "cast_iron" },
			}),
		);
	}

	if (large > 0) {
		const p = getMEPDefaultPrice("PLUMBING", "manhole_80x80");
		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "manholes",
				itemType: "manhole_80x80",
				name: "غرفة تفتيش 80×80 سم",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_manholes",
				quantity: large,
				unit: "عدد",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: { totalManholes, largeShare: large },
				sourceFormula: `${totalManholes} إجمالي → ${large} كبيرة`,
				specData: { size: "80x80cm", depth: "variable", cover: "cast_iron" },
			}),
		);
	}

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.5e: السخانات
// ═══════════════════════════════════════════════════════════════

function deriveHeaters(config: SmartBuildingConfig): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];
	const totalBathrooms = countAllRoomsByType(config, "bathroom");

	if (totalBathrooms === 0) return items;

	if (totalBathrooms <= 3) {
		// سخان 50 لتر لكل حمام
		const p = getMEPDefaultPrice("PLUMBING", "heater_50l");
		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "heaters",
				itemType: "heater_50l",
				name: "سخان كهربائي 50 لتر",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_heaters",
				quantity: totalBathrooms,
				unit: "عدد",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: { totalBathrooms, strategy: "individual" },
				sourceFormula: `${totalBathrooms} حمام ≤ 3 → سخان 50 لتر لكل حمام`,
				specData: { capacity: "50L", power: "1.5KW" },
			}),
		);
	} else {
		// سخان مركزي 80 لتر لكل حمامين
		const heaterCount = Math.ceil(totalBathrooms / 2);
		const p = getMEPDefaultPrice("PLUMBING", "heater_80l");
		items.push(
			makeItem({
				category: "PLUMBING",
				subCategory: "heaters",
				itemType: "heater_80l",
				name: "سخان مركزي 80 لتر",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "plumbing_heaters",
				quantity: heaterCount,
				unit: "عدد",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: {
					totalBathrooms,
					strategy: "central",
					ratio: "1:2",
				},
				sourceFormula: `${totalBathrooms} حمام > 3 → ${heaterCount} سخان (80 لتر لكل حمامين)`,
				specData: { capacity: "80L", power: "2.5KW" },
			}),
		);
	}

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.6: اشتقاق التكييف
// ═══════════════════════════════════════════════════════════════

function deriveACUnits(config: SmartBuildingConfig): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];

	for (const floor of config.floors) {
		if (floor.floorType === "ROOF") continue;

		for (const room of getFloorRooms(floor)) {
			const profile = ROOM_MEP_PROFILES[room.type as RoomType];
			if (!profile || !profile.needsAC) continue;

			const area = room.length * room.width;
			if (area <= 0) continue;

			const btuLoad = area * profile.coolingFactorBTU;
			const tons = btuLoad / 12000;
			const acSize = selectACSize(tons);

			// اختيار النوع المناسب من الأسعار
			let acItemType = "split_1ton";
			if (acSize <= 1) acItemType = "split_1ton";
			else if (acSize <= 1.5) acItemType = "split_1_5ton";
			else if (acSize <= 2) acItemType = "split_2ton";
			else if (acSize <= 2.5) acItemType = "split_2_5ton";
			else acItemType = "split_3ton";

			const p = getMEPDefaultPrice("HVAC", acItemType);
			const roomLabel = room.name || room.type;

			items.push(
				makeItem({
					category: "HVAC",
					subCategory: "ac_units",
					itemType: acItemType,
					name: `مكيف سبليت ${acSize} طن - ${roomLabel}`,
					floorId: floor.id,
					floorName: floor.name,
					roomId: room.id,
					roomName: roomLabel,
					scope: "per_room",
					groupKey: "hvac_ac",
					quantity: 1,
					unit: "وحدة",
					materialPrice: p.materialPrice,
					laborPrice: p.laborPrice,
					wastagePercent: p.wastagePercent,
					calculationData: {
						roomArea: area,
						coolingFactor: profile.coolingFactorBTU,
						btuLoad,
						tons: Math.round(tons * 100) / 100,
						selectedSize: acSize,
					},
					sourceFormula: `مساحة(${area.toFixed(1)}م²) × ${profile.coolingFactorBTU} BTU/م² = ${btuLoad} BTU → ${acSize} طن`,
					specData: {
						type: "wall_mount_split",
						refrigerant: "R410a",
						inverter: true,
					},
				}),
			);
		}
	}

	return items;
}

// ─── مواسير التبريد ───

function deriveRefrigerantPipes(
	config: SmartBuildingConfig,
): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];
	let floorIndex = 0;

	for (const floor of config.floors) {
		if (floor.floorType === "ROOF") continue;

		for (const room of getFloorRooms(floor)) {
			const profile = ROOM_MEP_PROFILES[room.type as RoomType];
			if (!profile || !profile.needsAC) continue;

			const area = room.length * room.width;
			if (area <= 0) continue;

			const btuLoad = area * profile.coolingFactorBTU;
			const tons = btuLoad / 12000;
			const acSize = selectACSize(tons);
			const pipes = selectRefrigerantPipes(acSize);

			// الطول = 5م أساس + (رقم الطابق × ارتفاع) + 2م فائض
			const pipeLength = 5 + floorIndex * (floor.height || 3) + 2;
			const p = getMEPDefaultPrice("HVAC", "copper_pipes");
			const roomLabel = room.name || room.type;

			items.push(
				makeItem({
					category: "HVAC",
					subCategory: "refrigerant",
					itemType: "copper_pipes",
					name: `مواسير تبريد نحاس - ${roomLabel}`,
					floorId: floor.id,
					floorName: floor.name,
					roomId: room.id,
					roomName: roomLabel,
					scope: "per_room",
					groupKey: "hvac_pipes",
					quantity: Math.ceil(pipeLength),
					unit: "م.ط",
					materialPrice: p.materialPrice,
					laborPrice: p.laborPrice,
					wastagePercent: p.wastagePercent,
					calculationData: {
						acSize,
						floorIndex,
						floorHeight: floor.height,
						liquid: pipes.liquid,
						suction: pipes.suction,
					},
					sourceFormula: `5م + (${floorIndex}×${floor.height || 3}م) + 2م = ${Math.ceil(pipeLength)}م.ط`,
					specData: {
						liquid: pipes.liquid,
						suction: pipes.suction,
						insulation: "rubber_foam",
					},
				}),
			);

			// ─── تصريف مكثفات ───
			const cp = getMEPDefaultPrice("HVAC", "condensate_pipe");
			items.push(
				makeItem({
					category: "HVAC",
					subCategory: "condensate",
					itemType: "condensate_pipe",
					name: `تصريف مكثفات - ${roomLabel}`,
					floorId: floor.id,
					floorName: floor.name,
					roomId: room.id,
					roomName: roomLabel,
					scope: "per_room",
					groupKey: "hvac_pipes",
					quantity: Math.ceil(pipeLength * 0.8), // 80% من طول النحاس
					unit: "م.ط",
					materialPrice: cp.materialPrice,
					laborPrice: cp.laborPrice,
					wastagePercent: cp.wastagePercent,
					calculationData: { basedOnCopperLength: pipeLength },
					sourceFormula: `${Math.ceil(pipeLength)}م × 80% = ${Math.ceil(pipeLength * 0.8)}م.ط`,
					specData: { material: "PVC", diameter: "20mm" },
				}),
			);
		}

		floorIndex++;
	}

	return items;
}

// ─── مراوح الشفط ───

function deriveVentilation(config: SmartBuildingConfig): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];

	for (const floor of config.floors) {
		if (floor.floorType === "ROOF") continue;

		for (const room of getFloorRooms(floor)) {
			const profile = ROOM_MEP_PROFILES[room.type as RoomType];
			if (!profile || !profile.needsExhaustFan) continue;

			const roomLabel = room.name || room.type;

			if (room.type === "kitchen") {
				const p = getMEPDefaultPrice("HVAC", "exhaust_fan_kitchen");
				items.push(
					makeItem({
						category: "HVAC",
						subCategory: "ventilation",
						itemType: "exhaust_fan_kitchen",
						name: `مروحة شفط مطبخ - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "hvac_ventilation",
						quantity: 1,
						unit: "عدد",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: "kitchen" },
						sourceFormula: "مطبخ → مروحة شفط مطبخ",
						specData: { cfm: 300, size: '8"' },
					}),
				);
			} else {
				// حمام أو غسيل
				const p = getMEPDefaultPrice("HVAC", "exhaust_fan_bath");
				items.push(
					makeItem({
						category: "HVAC",
						subCategory: "ventilation",
						itemType: "exhaust_fan_bath",
						name: `مروحة شفط - ${roomLabel}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: room.id,
						roomName: roomLabel,
						scope: "per_room",
						groupKey: "hvac_ventilation",
						quantity: 1,
						unit: "عدد",
						materialPrice: p.materialPrice,
						laborPrice: p.laborPrice,
						wastagePercent: p.wastagePercent,
						calculationData: { roomType: room.type },
						sourceFormula: `${room.type} → مروحة شفط`,
						specData: { cfm: 100, size: '6"' },
					}),
				);
			}
		}
	}

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.7: اشتقاق الحريق
// ═══════════════════════════════════════════════════════════════

function deriveFirefighting(
	config: SmartBuildingConfig,
	projectType: string,
): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];
	const totalArea = getTotalBuildingArea(config);
	const numFloors = totalFloorCount(config);
	const floors = habitableFloors(config);

	// ─── طفايات (لجميع الأنواع) ───
	const extinguisherCount = Math.max(2, Math.ceil(totalArea / 200));
	const extAbc = getMEPDefaultPrice("FIREFIGHTING", "extinguisher_abc");
	items.push(
		makeItem({
			category: "FIREFIGHTING",
			subCategory: "extinguishers",
			itemType: "extinguisher_abc",
			name: "طفاية حريق ABC",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "fire_extinguishers",
			quantity: extinguisherCount,
			unit: "عدد",
			materialPrice: extAbc.materialPrice,
			laborPrice: extAbc.laborPrice,
			wastagePercent: extAbc.wastagePercent,
			calculationData: { totalArea, coveragePer: 200 },
			sourceFormula: `مساحة(${Math.round(totalArea)}م²) ÷ 200 = ${extinguisherCount} طفاية`,
			specData: { type: "ABC dry powder", weight: "6kg" },
		}),
	);

	// ─── سكني: إنذار وصناديق فقط إذا > 3 طوابق ───
	if (projectType === "RESIDENTIAL") {
		if (numFloors > 3) {
			// كاشفات دخان بسيطة
			for (const floor of floors) {
				const detectorCount = Math.max(
					2,
					Math.ceil(floor.area / 70),
				);
				const sd = getMEPDefaultPrice(
					"FIREFIGHTING",
					"smoke_detector",
				);
				items.push(
					makeItem({
						category: "FIREFIGHTING",
						subCategory: "alarm",
						itemType: "smoke_detector",
						name: `كاشف دخان - ${floor.name}`,
						floorId: floor.id,
						floorName: floor.name,
						roomId: null,
						roomName: null,
						scope: "per_floor",
						groupKey: "fire_alarm",
						quantity: detectorCount,
						unit: "عدد",
						materialPrice: sd.materialPrice,
						laborPrice: sd.laborPrice,
						wastagePercent: sd.wastagePercent,
						calculationData: {
							floorArea: floor.area,
							coveragePer: 70,
						},
						sourceFormula: `مساحة(${floor.area}م²) ÷ 70 = ${detectorCount}`,
						specData: {
							type: "photoelectric",
							standard: "UL/FM",
						},
					}),
				);
			}

			// صناديق حريق
			const hoseCount = Math.max(1, Math.ceil(totalArea / 800));
			const hc = getMEPDefaultPrice("FIREFIGHTING", "hose_cabinet");
			items.push(
				makeItem({
					category: "FIREFIGHTING",
					subCategory: "hose_cabinets",
					itemType: "hose_cabinet",
					name: "صندوق حريق",
					floorId: null,
					floorName: null,
					roomId: null,
					roomName: null,
					scope: "per_building",
					groupKey: "fire_hose",
					quantity: hoseCount,
					unit: "عدد",
					materialPrice: hc.materialPrice,
					laborPrice: hc.laborPrice,
					wastagePercent: hc.wastagePercent,
					calculationData: { totalArea, coveragePer: 800 },
					sourceFormula: `مساحة(${Math.round(totalArea)}م²) ÷ 800 = ${hoseCount}`,
					specData: {
						type: "recessed",
						hoseLength: "30m",
						nozzle: "adjustable",
					},
				}),
			);
		}
		return items;
	}

	// ─── تجاري / صناعي: نظام كامل ───
	const sprinklerCoverage = projectType === "INDUSTRIAL" ? 9 : 12;

	for (const floor of floors) {
		// كاشفات دخان
		const smokeCount = Math.max(2, Math.ceil(floor.area / 70));
		const sd = getMEPDefaultPrice("FIREFIGHTING", "smoke_detector");
		items.push(
			makeItem({
				category: "FIREFIGHTING",
				subCategory: "alarm",
				itemType: "smoke_detector",
				name: `كاشف دخان - ${floor.name}`,
				floorId: floor.id,
				floorName: floor.name,
				roomId: null,
				roomName: null,
				scope: "per_floor",
				groupKey: "fire_alarm",
				quantity: smokeCount,
				unit: "عدد",
				materialPrice: sd.materialPrice,
				laborPrice: sd.laborPrice,
				wastagePercent: sd.wastagePercent,
				calculationData: { floorArea: floor.area, coveragePer: 70 },
				sourceFormula: `مساحة(${floor.area}م²) ÷ 70 = ${smokeCount}`,
				specData: { type: "photoelectric", standard: "UL/FM" },
			}),
		);

		// كاشفات حرارة (مطابخ)
		const kitchens = getFloorRoomsByType(floor, "kitchen");
		if (kitchens.length > 0) {
			const hd = getMEPDefaultPrice("FIREFIGHTING", "heat_detector");
			items.push(
				makeItem({
					category: "FIREFIGHTING",
					subCategory: "alarm",
					itemType: "heat_detector",
					name: `كاشف حرارة (مطابخ) - ${floor.name}`,
					floorId: floor.id,
					floorName: floor.name,
					roomId: null,
					roomName: null,
					scope: "per_floor",
					groupKey: "fire_alarm",
					quantity: kitchens.length,
					unit: "عدد",
					materialPrice: hd.materialPrice,
					laborPrice: hd.laborPrice,
					wastagePercent: hd.wastagePercent,
					calculationData: { kitchenCount: kitchens.length },
					sourceFormula: `${kitchens.length} مطبخ → كاشف حرارة`,
					specData: { type: "rate_of_rise", temp: "57°C" },
				}),
			);
		}

		// نقاط يدوية + صفارات: 2 لكل طابق
		const mcp = getMEPDefaultPrice("FIREFIGHTING", "manual_call_point");
		items.push(
			makeItem({
				category: "FIREFIGHTING",
				subCategory: "alarm",
				itemType: "manual_call_point",
				name: `نقطة إنذار يدوية - ${floor.name}`,
				floorId: floor.id,
				floorName: floor.name,
				roomId: null,
				roomName: null,
				scope: "per_floor",
				groupKey: "fire_alarm",
				quantity: 2,
				unit: "عدد",
				materialPrice: mcp.materialPrice,
				laborPrice: mcp.laborPrice,
				wastagePercent: mcp.wastagePercent,
				calculationData: { perFloor: 2 },
				sourceFormula: "2 نقطة يدوية لكل طابق",
				specData: { type: "break_glass", color: "red" },
			}),
		);

		const hs = getMEPDefaultPrice("FIREFIGHTING", "horn_strobe");
		items.push(
			makeItem({
				category: "FIREFIGHTING",
				subCategory: "alarm",
				itemType: "horn_strobe",
				name: `صفارة وإنارة إنذار - ${floor.name}`,
				floorId: floor.id,
				floorName: floor.name,
				roomId: null,
				roomName: null,
				scope: "per_floor",
				groupKey: "fire_alarm",
				quantity: 2,
				unit: "عدد",
				materialPrice: hs.materialPrice,
				laborPrice: hs.laborPrice,
				wastagePercent: hs.wastagePercent,
				calculationData: { perFloor: 2 },
				sourceFormula: "2 صفارة لكل طابق",
				specData: { type: "horn_strobe", dB: 90 },
			}),
		);

		// رشاشات
		const sprinklerCount = Math.ceil(floor.area / sprinklerCoverage);
		const sp = getMEPDefaultPrice("FIREFIGHTING", "sprinkler_head");
		items.push(
			makeItem({
				category: "FIREFIGHTING",
				subCategory: "sprinklers",
				itemType: "sprinkler_head",
				name: `رشاش حريق - ${floor.name}`,
				floorId: floor.id,
				floorName: floor.name,
				roomId: null,
				roomName: null,
				scope: "per_floor",
				groupKey: "fire_sprinklers",
				quantity: sprinklerCount,
				unit: "عدد",
				materialPrice: sp.materialPrice,
				laborPrice: sp.laborPrice,
				wastagePercent: sp.wastagePercent,
				calculationData: {
					floorArea: floor.area,
					coverage: sprinklerCoverage,
				},
				sourceFormula: `مساحة(${floor.area}م²) ÷ ${sprinklerCoverage} = ${sprinklerCount}`,
				specData: {
					type: "pendant",
					temp: "68°C",
					kFactor: 5.6,
				},
			}),
		);
	}

	// صناديق حريق
	const hoseCount = Math.max(1, Math.ceil(totalArea / 800));
	const hc = getMEPDefaultPrice("FIREFIGHTING", "hose_cabinet");
	items.push(
		makeItem({
			category: "FIREFIGHTING",
			subCategory: "hose_cabinets",
			itemType: "hose_cabinet",
			name: "صندوق حريق",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "fire_hose",
			quantity: hoseCount,
			unit: "عدد",
			materialPrice: hc.materialPrice,
			laborPrice: hc.laborPrice,
			wastagePercent: hc.wastagePercent,
			calculationData: { totalArea, coveragePer: 800 },
			sourceFormula: `مساحة(${Math.round(totalArea)}م²) ÷ 800 = ${hoseCount}`,
			specData: {
				type: "recessed",
				hoseLength: "30m",
				nozzle: "adjustable",
			},
		}),
	);

	// لوحة إنذار مركزية
	const facp = getMEPDefaultPrice("FIREFIGHTING", "facp_8zone");
	items.push(
		makeItem({
			category: "FIREFIGHTING",
			subCategory: "alarm",
			itemType: "facp_8zone",
			name: "لوحة إنذار حريق مركزية",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "fire_alarm",
			quantity: 1,
			unit: "عدد",
			materialPrice: facp.materialPrice,
			laborPrice: facp.laborPrice,
			wastagePercent: facp.wastagePercent,
			calculationData: { totalFloors: numFloors },
			sourceFormula: "لوحة إنذار مركزية واحدة",
			specData: { zones: 8, type: "addressable" },
		}),
	);

	// مضخة حريق + جوكي + خزان
	const firePumpMain = getMEPDefaultPrice("FIREFIGHTING", "fire_pump_main");
	items.push(
		makeItem({
			category: "FIREFIGHTING",
			subCategory: "fire_pumps",
			itemType: "fire_pump_main",
			name: "مضخة حريق رئيسية",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "fire_pumps",
			quantity: 1,
			unit: "عدد",
			materialPrice: firePumpMain.materialPrice,
			laborPrice: firePumpMain.laborPrice,
			wastagePercent: firePumpMain.wastagePercent,
			calculationData: { totalArea },
			sourceFormula: "مضخة حريق رئيسية واحدة",
			specData: { type: "electric", flow: "variable" },
		}),
	);

	const jockeyPump = getMEPDefaultPrice("FIREFIGHTING", "jockey_pump");
	items.push(
		makeItem({
			category: "FIREFIGHTING",
			subCategory: "fire_pumps",
			itemType: "jockey_pump",
			name: "مضخة جوكي (ضغط)",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "fire_pumps",
			quantity: 1,
			unit: "عدد",
			materialPrice: jockeyPump.materialPrice,
			laborPrice: jockeyPump.laborPrice,
			wastagePercent: jockeyPump.wastagePercent,
			calculationData: {},
			sourceFormula: "مضخة جوكي واحدة",
			specData: { type: "vertical_multistage" },
		}),
	);

	// خزان حريق: 45 دقيقة × flow تقديري
	const fireTankM3 = Math.max(15, Math.ceil(totalArea / 100)); // تقدير
	const ft = getMEPDefaultPrice("FIREFIGHTING", "fire_tank");
	items.push(
		makeItem({
			category: "FIREFIGHTING",
			subCategory: "fire_tank",
			itemType: "fire_tank",
			name: "خزان حريق",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "fire_tank",
			quantity: fireTankM3,
			unit: "م³",
			materialPrice: ft.materialPrice,
			laborPrice: ft.laborPrice,
			wastagePercent: ft.wastagePercent,
			calculationData: { totalArea, minCapacity: 15 },
			sourceFormula: `مساحة(${Math.round(totalArea)}م²) ÷ 100 = ${fireTankM3} م³ (حد أدنى 15)`,
			specData: { material: "concrete/fiberglass", duration: "45min" },
		}),
	);

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.8: التيار الخفيف
// ═══════════════════════════════════════════════════════════════

function deriveLowCurrent(
	config: SmartBuildingConfig,
	projectType: string,
): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];

	// ─── نقاط شبكة ───
	for (const floor of config.floors) {
		if (floor.floorType === "ROOF") continue;

		for (const room of getFloorRooms(floor)) {
			const profile = ROOM_MEP_PROFILES[room.type as RoomType];
			if (!profile || profile.networkPoints <= 0) continue;

			const roomLabel = room.name || room.type;
			const p = getMEPDefaultPrice("LOW_CURRENT", "network_point");

			items.push(
				makeItem({
					category: "LOW_CURRENT",
					subCategory: "network",
					itemType: "network_point",
					name: `نقطة شبكة - ${roomLabel}`,
					floorId: floor.id,
					floorName: floor.name,
					roomId: room.id,
					roomName: roomLabel,
					scope: "per_room",
					groupKey: "low_current_network",
					quantity: profile.networkPoints,
					unit: "نقطة",
					materialPrice: p.materialPrice,
					laborPrice: p.laborPrice,
					wastagePercent: p.wastagePercent,
					calculationData: { roomType: room.type },
					sourceFormula: `${room.type} → ${profile.networkPoints} نقطة شبكة`,
					specData: { cable: "Cat6", faceplate: "RJ45" },
				}),
			);
		}
	}

	// ─── كاميرات مراقبة ───
	const perimeter = config.buildingPerimeter || 0;
	const cameraCount = Math.max(2, 2 + Math.ceil(perimeter / 30)); // مدخلين + محيط
	const camPrice = getMEPDefaultPrice("LOW_CURRENT", "camera_bullet");

	items.push(
		makeItem({
			category: "LOW_CURRENT",
			subCategory: "cctv",
			itemType: "camera_bullet",
			name: "كاميرا مراقبة خارجية",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "low_current_cctv",
			quantity: cameraCount,
			unit: "عدد",
			materialPrice: camPrice.materialPrice,
			laborPrice: camPrice.laborPrice,
			wastagePercent: camPrice.wastagePercent,
			calculationData: { perimeter, entrances: 2, perimeterCoverage: 30 },
			sourceFormula: `2 مدخل + (${perimeter || "~"}م ÷ 30) = ${cameraCount} كاميرا`,
			specData: {
				type: "bullet",
				resolution: "4MP",
				ir: "30m",
				ip: "IP67",
			},
		}),
	);

	// ─── جهاز تسجيل NVR ───
	const nvrPrice = getMEPDefaultPrice("LOW_CURRENT", "nvr_8ch");
	items.push(
		makeItem({
			category: "LOW_CURRENT",
			subCategory: "cctv",
			itemType: "nvr_8ch",
			name: "جهاز تسجيل NVR 8 قنوات",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "low_current_cctv",
			quantity: Math.ceil(cameraCount / 8), // NVR لكل 8 كاميرات
			unit: "عدد",
			materialPrice: nvrPrice.materialPrice,
			laborPrice: nvrPrice.laborPrice,
			wastagePercent: nvrPrice.wastagePercent,
			calculationData: { cameras: cameraCount },
			sourceFormula: `${cameraCount} كاميرا ÷ 8 = ${Math.ceil(cameraCount / 8)} NVR`,
			specData: { channels: 8, hdd: "4TB", poe: true },
		}),
	);

	// ─── انتركم ───
	const intercomOutdoor = getMEPDefaultPrice(
		"LOW_CURRENT",
		"intercom_outdoor",
	);
	items.push(
		makeItem({
			category: "LOW_CURRENT",
			subCategory: "intercom",
			itemType: "intercom_outdoor",
			name: "وحدة انتركم خارجية",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "low_current_intercom",
			quantity: 1,
			unit: "عدد",
			materialPrice: intercomOutdoor.materialPrice,
			laborPrice: intercomOutdoor.laborPrice,
			wastagePercent: intercomOutdoor.wastagePercent,
			calculationData: {},
			sourceFormula: "وحدة خارجية واحدة",
			specData: { type: "video", camera: "2MP" },
		}),
	);

	// وحدات داخلية: واحدة لكل طابق (سكني) أو أكثر
	const indoorCount = habitableFloors(config).length;
	const intercomIndoor = getMEPDefaultPrice(
		"LOW_CURRENT",
		"intercom_indoor",
	);
	items.push(
		makeItem({
			category: "LOW_CURRENT",
			subCategory: "intercom",
			itemType: "intercom_indoor",
			name: "وحدة انتركم داخلية",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "per_building",
			groupKey: "low_current_intercom",
			quantity: indoorCount,
			unit: "عدد",
			materialPrice: intercomIndoor.materialPrice,
			laborPrice: intercomIndoor.laborPrice,
			wastagePercent: intercomIndoor.wastagePercent,
			calculationData: { floors: indoorCount },
			sourceFormula: `${indoorCount} طابق → ${indoorCount} وحدة داخلية`,
			specData: { type: "video_monitor", screen: '7"' },
		}),
	);

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.8b: أنظمة خاصة
// ═══════════════════════════════════════════════════════════════

function deriveSpecialSystems(
	config: SmartBuildingConfig,
	projectType: string,
): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];
	const numFloors = totalFloorCount(config);

	// ─── مصعد ───
	if (numFloors >= 5) {
		const elevatorType =
			numFloors >= 10 ? "elevator_8person" : "elevator_6person";
		const elevatorLabel =
			numFloors >= 10 ? "8 أشخاص" : "6 أشخاص";
		const p = getMEPDefaultPrice("SPECIAL", elevatorType);

		items.push(
			makeItem({
				category: "SPECIAL",
				subCategory: "elevator",
				itemType: elevatorType,
				name: `مصعد ركاب ${elevatorLabel}`,
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "special_elevator",
				quantity: 1,
				unit: "عدد",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: { numFloors, capacity: elevatorLabel },
				sourceFormula: `${numFloors} طابق ≥ 5 → مصعد ${elevatorLabel}`,
				specData: {
					type: "traction",
					stops: numFloors,
					speed: "1.0 m/s",
				},
			}),
		);
	}

	// ─── مولد كهربائي ───
	if (projectType !== "RESIDENTIAL" || numFloors >= 8) {
		const totalArea = getTotalBuildingArea(config);
		// تقدير الحمل: 15 واط/م² × 70% diversity
		const loadKVA = Math.ceil(
			(totalArea * 15 * 0.7) / 1000,
		);
		let genType = "generator_30kva";
		let genLabel = "30 KVA";
		if (loadKVA > 30 && loadKVA <= 100) {
			genType = "generator_100kva";
			genLabel = "100 KVA";
		} else if (loadKVA > 100) {
			genType = "generator_250kva";
			genLabel = "250 KVA";
		}

		const p = getMEPDefaultPrice("SPECIAL", genType);
		items.push(
			makeItem({
				category: "SPECIAL",
				subCategory: "generator",
				itemType: genType,
				name: `مولد كهربائي ${genLabel}`,
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "per_building",
				groupKey: "special_generator",
				quantity: 1,
				unit: "عدد",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: {
					totalArea,
					wattsPerM2: 15,
					diversity: 0.7,
					loadKVA,
				},
				sourceFormula: `مساحة(${Math.round(totalArea)}م²) × 15W × 70% = ${loadKVA} KVA → ${genLabel}`,
				specData: {
					type: "diesel",
					ats: true,
					soundproof: true,
				},
			}),
		);
	}

	return items;
}

// ═══════════════════════════════════════════════════════════════
// 3.8c: الأعمال الخارجية MEP
// ═══════════════════════════════════════════════════════════════

function deriveExteriorMEP(config: SmartBuildingConfig): MEPDerivedItem[] {
	const items: MEPDerivedItem[] = [];

	const fenceLength = config.landPerimeter || config.buildingPerimeter || 0;
	const hasGarden = config.hasGarden ?? false;
	const gardenPercentage = config.gardenPercentage ?? 0;
	const gardenArea =
		hasGarden && gardenPercentage > 0
			? config.totalLandArea * (gardenPercentage / 100)
			: 0;

	// ─── إنارة سور ───
	if (fenceLength > 0) {
		const fenceLights = Math.ceil(fenceLength / 8);
		const p = getMEPDefaultPrice("ELECTRICAL", "outdoor_light");
		items.push(
			makeItem({
				category: "ELECTRICAL",
				subCategory: "lighting",
				itemType: "outdoor_light",
				name: "إنارة سور خارجية",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "external",
				groupKey: "electrical_exterior",
				quantity: fenceLights,
				unit: "نقطة",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: { fenceLength, spacing: 8 },
				sourceFormula: `طول السور(${fenceLength}م) ÷ 8 = ${fenceLights} نقطة`,
				specData: {
					type: "wall_mount",
					wattage: "20W LED",
					ip: "IP65",
				},
			}),
		);
	}

	// ─── إنارة حديقة ───
	if (gardenArea > 0) {
		const gardenLights = Math.ceil(gardenArea / 25);
		const p = getMEPDefaultPrice("ELECTRICAL", "outdoor_light");
		items.push(
			makeItem({
				category: "ELECTRICAL",
				subCategory: "lighting",
				itemType: "outdoor_light",
				name: "إنارة حديقة",
				floorId: null,
				floorName: null,
				roomId: null,
				roomName: null,
				scope: "external",
				groupKey: "electrical_exterior",
				quantity: gardenLights,
				unit: "نقطة",
				materialPrice: p.materialPrice,
				laborPrice: p.laborPrice,
				wastagePercent: p.wastagePercent,
				calculationData: { gardenArea, coveragePer: 25 },
				sourceFormula: `حديقة(${Math.round(gardenArea)}م²) ÷ 25 = ${gardenLights} نقطة`,
				specData: {
					type: "bollard",
					wattage: "10W LED",
					ip: "IP65",
				},
			}),
		);
	}

	// ─── أفياش خارجية مقاومة للماء ───
	const extOutletPrice = getMEPDefaultPrice("ELECTRICAL", "outlet_external");
	items.push(
		makeItem({
			category: "ELECTRICAL",
			subCategory: "power_outlets",
			itemType: "outlet_external",
			name: "فيش خارجي مقاوم للماء",
			floorId: null,
			floorName: null,
			roomId: null,
			roomName: null,
			scope: "external",
			groupKey: "electrical_exterior",
			quantity: 2, // أمام + خلف
			unit: "نقطة",
			materialPrice: extOutletPrice.materialPrice,
			laborPrice: extOutletPrice.laborPrice,
			wastagePercent: extOutletPrice.wastagePercent,
			calculationData: { front: 1, back: 1 },
			sourceFormula: "2 نقطة (أمام + خلف)",
			specData: { rating: "13A", ip: "IP55", type: "weatherproof" },
		}),
	);

	return items;
}

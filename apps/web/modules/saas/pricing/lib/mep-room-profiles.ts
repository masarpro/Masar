import type { RoomType } from "../lib/smart-building-types";
import type { RoomMEPProfile } from "../types/mep";

/**
 * لكل نوع غرفة: ما هي متطلبات MEP الكهربائية والصحية والتكييف؟
 *
 * القيم مبنية على:
 * - كود البناء السعودي (SBC)
 * - معايير ASHRAE للتكييف (مع ضبط للمناخ السعودي الحار)
 * - الممارسات الشائعة عند المقاولين السعوديين
 */
export const ROOM_MEP_PROFILES: Record<RoomType, RoomMEPProfile> = {
	bedroom: {
		spotLightCoverage: 2.5,
		luxLevel: 200,
		hasChandelier: false,
		outlets13A: 6,
		outlets20A_AC: 1,
		outlets20A_heater: 0,
		outlets32A_oven: 0,
		outlets20A_washer: 0,
		needsAC: true,
		coolingFactorBTU: 700,
		hasWaterSupply: false,
		hasDrainage: false,
		needsExhaustFan: false,
		plumbingFixtures: {
			washbasin: 0,
			wc: 0,
			shower: 0,
			bathtub: 0,
			kitchenSink: 0,
			washer: 0,
			bidet: 0,
		},
		fixtureUnits: 0,
		drainageFixtureUnits: 0,
		networkPoints: 1,
	},
	living: {
		spotLightCoverage: 2.0,
		luxLevel: 300,
		hasChandelier: true,
		outlets13A: 10,
		outlets20A_AC: 1,
		outlets20A_heater: 0,
		outlets32A_oven: 0,
		outlets20A_washer: 0,
		needsAC: true,
		coolingFactorBTU: 800,
		hasWaterSupply: false,
		hasDrainage: false,
		needsExhaustFan: false,
		plumbingFixtures: {
			washbasin: 0,
			wc: 0,
			shower: 0,
			bathtub: 0,
			kitchenSink: 0,
			washer: 0,
			bidet: 0,
		},
		fixtureUnits: 0,
		drainageFixtureUnits: 0,
		networkPoints: 2,
	},
	majlis: {
		spotLightCoverage: 2.0,
		luxLevel: 300,
		hasChandelier: true,
		outlets13A: 8,
		outlets20A_AC: 1,
		outlets20A_heater: 0,
		outlets32A_oven: 0,
		outlets20A_washer: 0,
		needsAC: true,
		coolingFactorBTU: 800,
		hasWaterSupply: false,
		hasDrainage: false,
		needsExhaustFan: false,
		plumbingFixtures: {
			washbasin: 0,
			wc: 0,
			shower: 0,
			bathtub: 0,
			kitchenSink: 0,
			washer: 0,
			bidet: 0,
		},
		fixtureUnits: 0,
		drainageFixtureUnits: 0,
		networkPoints: 1,
	},
	kitchen: {
		spotLightCoverage: 1.5,
		luxLevel: 500,
		hasChandelier: false,
		outlets13A: 6,
		outlets20A_AC: 1,
		outlets20A_heater: 0,
		outlets32A_oven: 1,
		outlets20A_washer: 0,
		needsAC: true,
		coolingFactorBTU: 900,
		hasWaterSupply: true,
		hasDrainage: true,
		needsExhaustFan: true,
		plumbingFixtures: {
			washbasin: 0,
			wc: 0,
			shower: 0,
			bathtub: 0,
			kitchenSink: 1,
			washer: 0,
			bidet: 0,
		},
		fixtureUnits: 2,
		drainageFixtureUnits: 2,
		networkPoints: 1,
	},
	bathroom: {
		spotLightCoverage: 2.5,
		luxLevel: 250,
		hasChandelier: false,
		outlets13A: 1,
		outlets20A_AC: 0,
		outlets20A_heater: 1,
		outlets32A_oven: 0,
		outlets20A_washer: 0,
		needsAC: false,
		coolingFactorBTU: 0,
		hasWaterSupply: true,
		hasDrainage: true,
		needsExhaustFan: true,
		plumbingFixtures: {
			washbasin: 1,
			wc: 1,
			shower: 1,
			bathtub: 0,
			kitchenSink: 0,
			washer: 0,
			bidet: 0,
		},
		fixtureUnits: 8,
		drainageFixtureUnits: 7,
		networkPoints: 0,
	},
	hall: {
		spotLightCoverage: 2.0,
		luxLevel: 250,
		hasChandelier: true,
		outlets13A: 6,
		outlets20A_AC: 1,
		outlets20A_heater: 0,
		outlets32A_oven: 0,
		outlets20A_washer: 0,
		needsAC: true,
		coolingFactorBTU: 750,
		hasWaterSupply: false,
		hasDrainage: false,
		needsExhaustFan: false,
		plumbingFixtures: {
			washbasin: 0,
			wc: 0,
			shower: 0,
			bathtub: 0,
			kitchenSink: 0,
			washer: 0,
			bidet: 0,
		},
		fixtureUnits: 0,
		drainageFixtureUnits: 0,
		networkPoints: 1,
	},
	corridor: {
		spotLightCoverage: 3.0,
		luxLevel: 100,
		hasChandelier: false,
		outlets13A: 2,
		outlets20A_AC: 0,
		outlets20A_heater: 0,
		outlets32A_oven: 0,
		outlets20A_washer: 0,
		needsAC: false,
		coolingFactorBTU: 0,
		hasWaterSupply: false,
		hasDrainage: false,
		needsExhaustFan: false,
		plumbingFixtures: {
			washbasin: 0,
			wc: 0,
			shower: 0,
			bathtub: 0,
			kitchenSink: 0,
			washer: 0,
			bidet: 0,
		},
		fixtureUnits: 0,
		drainageFixtureUnits: 0,
		networkPoints: 0,
	},
	storage: {
		spotLightCoverage: 4.0,
		luxLevel: 100,
		hasChandelier: false,
		outlets13A: 2,
		outlets20A_AC: 0,
		outlets20A_heater: 0,
		outlets32A_oven: 0,
		outlets20A_washer: 0,
		needsAC: false,
		coolingFactorBTU: 0,
		hasWaterSupply: false,
		hasDrainage: false,
		needsExhaustFan: false,
		plumbingFixtures: {
			washbasin: 0,
			wc: 0,
			shower: 0,
			bathtub: 0,
			kitchenSink: 0,
			washer: 0,
			bidet: 0,
		},
		fixtureUnits: 0,
		drainageFixtureUnits: 0,
		networkPoints: 0,
	},
	laundry: {
		spotLightCoverage: 2.5,
		luxLevel: 200,
		hasChandelier: false,
		outlets13A: 2,
		outlets20A_AC: 0,
		outlets20A_heater: 0,
		outlets32A_oven: 0,
		outlets20A_washer: 1,
		needsAC: false,
		coolingFactorBTU: 0,
		hasWaterSupply: true,
		hasDrainage: true,
		needsExhaustFan: true,
		plumbingFixtures: {
			washbasin: 0,
			wc: 0,
			shower: 0,
			bathtub: 0,
			kitchenSink: 0,
			washer: 1,
			bidet: 0,
		},
		fixtureUnits: 3,
		drainageFixtureUnits: 3,
		networkPoints: 0,
	},
	maid_room: {
		spotLightCoverage: 2.5,
		luxLevel: 200,
		hasChandelier: false,
		outlets13A: 4,
		outlets20A_AC: 1,
		outlets20A_heater: 0,
		outlets32A_oven: 0,
		outlets20A_washer: 0,
		needsAC: true,
		coolingFactorBTU: 700,
		hasWaterSupply: false,
		hasDrainage: false,
		needsExhaustFan: false,
		plumbingFixtures: {
			washbasin: 0,
			wc: 0,
			shower: 0,
			bathtub: 0,
			kitchenSink: 0,
			washer: 0,
			bidet: 0,
		},
		fixtureUnits: 0,
		drainageFixtureUnits: 0,
		networkPoints: 0,
	},
	other: {
		spotLightCoverage: 2.5,
		luxLevel: 200,
		hasChandelier: false,
		outlets13A: 4,
		outlets20A_AC: 1,
		outlets20A_heater: 0,
		outlets32A_oven: 0,
		outlets20A_washer: 0,
		needsAC: true,
		coolingFactorBTU: 700,
		hasWaterSupply: false,
		hasDrainage: false,
		needsExhaustFan: false,
		plumbingFixtures: {
			washbasin: 0,
			wc: 0,
			shower: 0,
			bathtub: 0,
			kitchenSink: 0,
			washer: 0,
			bidet: 0,
		},
		fixtureUnits: 0,
		drainageFixtureUnits: 0,
		networkPoints: 0,
	},
};

/**
 * Helper: عدد الأشخاص المقدر من عدد غرف النوم
 */
export function estimateOccupants(
	floors: Array<{ rooms: Array<{ type: string }> }>,
): number {
	let bedrooms = 0;
	for (const floor of floors) {
		for (const room of floor.rooms) {
			if (room.type === "bedroom" || room.type === "maid_room") bedrooms++;
		}
	}
	return Math.max(bedrooms * 2, 4);
}

/**
 * Helper: اختيار حجم مكيف مناسب (أقرب حجم قياسي)
 */
export function selectACSize(tons: number): number {
	const sizes = [1, 1.5, 2, 2.5, 3, 4, 5];
	for (const size of sizes) {
		if (tons <= size) return size;
	}
	return Math.ceil(tons);
}

/**
 * Helper: اختيار قطر ماسورة التغذية حسب FU
 */
export function selectSupplyPipeSize(totalFU: number): {
	size: number;
	label: string;
} {
	if (totalFU <= 5) return { size: 20, label: '20mm (3/4")' };
	if (totalFU <= 15) return { size: 25, label: '25mm (1")' };
	if (totalFU <= 30) return { size: 32, label: '32mm (1.25")' };
	if (totalFU <= 60) return { size: 40, label: '40mm (1.5")' };
	if (totalFU <= 100) return { size: 50, label: '50mm (2")' };
	if (totalFU <= 200) return { size: 63, label: '63mm (2.5")' };
	return { size: 75, label: '75mm (3")' };
}

/**
 * Helper: اختيار مقاس الكيبل حسب الحمل
 */
export function selectCableSize(loadKW: number): {
	size: string;
	ampacity: number;
} {
	const current = (loadKW * 1000) / (400 * 1.732 * 0.85); // ثلاثي الأطوار
	if (current <= 25) return { size: "4×6mm²", ampacity: 32 };
	if (current <= 45) return { size: "4×10mm²", ampacity: 45 };
	if (current <= 60) return { size: "4×16mm²", ampacity: 60 };
	if (current <= 80) return { size: "4×25mm²", ampacity: 80 };
	if (current <= 100) return { size: "4×35mm²", ampacity: 100 };
	if (current <= 125) return { size: "4×50mm²", ampacity: 125 };
	if (current <= 160) return { size: "4×70mm²", ampacity: 160 };
	if (current <= 200) return { size: "4×95mm²", ampacity: 200 };
	return { size: "4×120mm²", ampacity: 250 };
}

/**
 * Helper: مقاسات مواسير التبريد حسب سعة المكيف
 */
export function selectRefrigerantPipes(tons: number): {
	liquid: string;
	suction: string;
} {
	if (tons <= 1.5) return { liquid: '1/4"', suction: '1/2"' };
	if (tons <= 2) return { liquid: '1/4"', suction: '5/8"' };
	if (tons <= 3) return { liquid: '3/8"', suction: '5/8"' };
	if (tons <= 4) return { liquid: '3/8"', suction: '3/4"' };
	return { liquid: '3/8"', suction: '7/8"' };
}

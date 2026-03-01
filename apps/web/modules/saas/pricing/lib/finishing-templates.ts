import type { BuildingConfig } from "./finishing-types";

interface FinishingItemInput {
	category: string;
	subCategory?: string;
	name: string;
	floorId?: string;
	floorName?: string;
	area?: number;
	quantity?: number;
	length?: number;
	unit: string;
	wastagePercent: number;
	qualityLevel?: string;
	materialPrice: number;
	laborPrice: number;
	totalCost: number;
}

type QualityPreset = "ECONOMY" | "STANDARD" | "PREMIUM";

const QUALITY_PRICES: Record<
	QualityPreset,
	{
		flooring: { material: number; labor: number };
		paint: { material: number; labor: number };
		plaster: { material: number; labor: number };
		ceiling: { material: number; labor: number };
		wallTiles: { material: number; labor: number };
		doors: { material: number; labor: number };
		windows: { material: number; labor: number };
		bathrooms: { material: number; labor: number };
		kitchen: { material: number; labor: number };
	}
> = {
	ECONOMY: {
		flooring: { material: 35, labor: 20 },
		paint: { material: 12, labor: 8 },
		plaster: { material: 20, labor: 15 },
		ceiling: { material: 35, labor: 20 },
		wallTiles: { material: 40, labor: 25 },
		doors: { material: 400, labor: 100 },
		windows: { material: 250, labor: 80 },
		bathrooms: { material: 2500, labor: 1000 },
		kitchen: { material: 600, labor: 200 },
	},
	STANDARD: {
		flooring: { material: 70, labor: 25 },
		paint: { material: 25, labor: 10 },
		plaster: { material: 30, labor: 18 },
		ceiling: { material: 60, labor: 25 },
		wallTiles: { material: 80, labor: 30 },
		doors: { material: 900, labor: 200 },
		windows: { material: 500, labor: 120 },
		bathrooms: { material: 6000, labor: 2000 },
		kitchen: { material: 1200, labor: 400 },
	},
	PREMIUM: {
		flooring: { material: 150, labor: 35 },
		paint: { material: 45, labor: 15 },
		plaster: { material: 45, labor: 22 },
		ceiling: { material: 100, labor: 35 },
		wallTiles: { material: 160, labor: 40 },
		doors: { material: 2500, labor: 500 },
		windows: { material: 900, labor: 200 },
		bathrooms: { material: 15000, labor: 4000 },
		kitchen: { material: 3000, labor: 700 },
	},
};

function calcCost(
	qty: number,
	wastage: number,
	material: number,
	labor: number,
): number {
	const eff = qty * (1 + wastage / 100);
	return Math.round(eff * (material + labor));
}

export function generateVillaTemplate(
	config: BuildingConfig,
	quality: QualityPreset = "STANDARD",
): FinishingItemInput[] {
	const items: FinishingItemInput[] = [];
	const prices = QUALITY_PRICES[quality];
	const floors = config.floors.filter((f) => f.floorType !== "ROOF");

	// PER_FLOOR items: flooring, paint, plaster, ceiling
	for (const floor of floors) {
		const area = floor.area * floor.repeatCount;
		const floorArea = area * 0.85;
		const wallArea =
			config.buildingPerimeter * floor.height + area;
		const ceilingArea = area * 0.7;

		// Flooring
		items.push({
			category: "FINISHING_FLOOR_TILES",
			subCategory: "FT_PORCELAIN",
			name: `أرضيات ${floor.name}`,
			floorId: floor.id,
			floorName: floor.name,
			area: Math.round(floorArea),
			unit: "m2",
			wastagePercent: 10,
			qualityLevel: quality,
			materialPrice: prices.flooring.material,
			laborPrice: prices.flooring.labor,
			totalCost: calcCost(
				floorArea,
				10,
				prices.flooring.material,
				prices.flooring.labor,
			),
		});

		// Interior Paint
		items.push({
			category: "FINISHING_INTERIOR_PAINT",
			subCategory: "PAINT_PLASTIC",
			name: `دهان داخلي ${floor.name}`,
			floorId: floor.id,
			floorName: floor.name,
			area: Math.round(wallArea),
			unit: "m2",
			wastagePercent: 10,
			qualityLevel: quality,
			materialPrice: prices.paint.material,
			laborPrice: prices.paint.labor,
			totalCost: calcCost(
				wallArea,
				10,
				prices.paint.material,
				prices.paint.labor,
			),
		});

		// Internal Plaster
		items.push({
			category: "FINISHING_INTERNAL_PLASTER",
			subCategory: "IP_CEMENT",
			name: `لياسة داخلية ${floor.name}`,
			floorId: floor.id,
			floorName: floor.name,
			area: Math.round(wallArea),
			unit: "m2",
			wastagePercent: 5,
			qualityLevel: quality,
			materialPrice: prices.plaster.material,
			laborPrice: prices.plaster.labor,
			totalCost: calcCost(
				wallArea,
				5,
				prices.plaster.material,
				prices.plaster.labor,
			),
		});

		// False Ceiling
		items.push({
			category: "FINISHING_FALSE_CEILING",
			subCategory: "FC_FLAT",
			name: `جبس بورد ${floor.name}`,
			floorId: floor.id,
			floorName: floor.name,
			area: Math.round(ceilingArea),
			unit: "m2",
			wastagePercent: 10,
			qualityLevel: quality,
			materialPrice: prices.ceiling.material,
			laborPrice: prices.ceiling.labor,
			totalCost: calcCost(
				ceilingArea,
				10,
				prices.ceiling.material,
				prices.ceiling.labor,
			),
		});
	}

	// WHOLE_BUILDING items
	const totalArea = floors.reduce(
		(s, f) => s + f.area * f.repeatCount,
		0,
	);
	const doorCount = Math.ceil(totalArea / 35);
	const windowArea = Math.round(totalArea * 0.12);
	const bathroomCount = Math.max(2, Math.ceil(totalArea / 100));

	// Doors
	items.push({
		category: "FINISHING_INTERIOR_DOORS",
		subCategory: "ID_WOOD_HDF",
		name: "أبواب داخلية",
		quantity: doorCount,
		unit: "piece",
		wastagePercent: 0,
		qualityLevel: quality,
		materialPrice: prices.doors.material,
		laborPrice: prices.doors.labor,
		totalCost: doorCount * (prices.doors.material + prices.doors.labor),
	});

	// Windows
	items.push({
		category: "FINISHING_WINDOWS",
		subCategory: "WIN_SLIDING",
		name: "نوافذ ألمنيوم",
		area: windowArea,
		unit: "m2",
		wastagePercent: 0,
		qualityLevel: quality,
		materialPrice: prices.windows.material,
		laborPrice: prices.windows.labor,
		totalCost: windowArea * (prices.windows.material + prices.windows.labor),
	});

	// Bathrooms
	items.push({
		category: "FINISHING_BATHROOMS",
		subCategory: "BT_STANDARD",
		name: "تجهيز حمامات",
		quantity: bathroomCount,
		unit: "set",
		wastagePercent: 0,
		qualityLevel: quality,
		materialPrice: prices.bathrooms.material,
		laborPrice: prices.bathrooms.labor,
		totalCost:
			bathroomCount *
			(prices.bathrooms.material + prices.bathrooms.labor),
	});

	// Kitchen
	const kitchenLength = 6;
	items.push({
		category: "FINISHING_KITCHEN",
		subCategory: "KT_LOWER",
		name: "خزائن وسطح عمل المطبخ",
		length: kitchenLength,
		unit: "m",
		wastagePercent: 0,
		qualityLevel: quality,
		materialPrice: prices.kitchen.material,
		laborPrice: prices.kitchen.labor,
		totalCost:
			kitchenLength * (prices.kitchen.material + prices.kitchen.labor),
	});

	return items;
}

export function generateApartmentTemplate(
	config: BuildingConfig,
	quality: QualityPreset = "STANDARD",
): FinishingItemInput[] {
	// Same logic, slightly different ratios
	return generateVillaTemplate(config, quality);
}

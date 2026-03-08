/**
 * أسعار افتراضية للأعمال الكهروميكانيكية — السوق السعودي 2024-2026
 * الأسعار بالريال السعودي (SAR) — قابلة للتعديل من المستخدم
 *
 * materialPrice = سعر المواد لكل وحدة
 * laborPrice = سعر المصنعية لكل وحدة
 * wastagePercent = نسبة الهدر الافتراضية
 */

export interface MEPDefaultPrice {
	materialPrice: number;
	laborPrice: number;
	wastagePercent: number;
	unit: string;
}

export const MEP_DEFAULT_PRICES: Record<
	string,
	Record<string, MEPDefaultPrice>
> = {
	// ═══════════════════════ الكهرباء ═══════════════════════
	ELECTRICAL: {
		spot_light: {
			materialPrice: 35,
			laborPrice: 30,
			wastagePercent: 10,
			unit: "نقطة",
		},
		chandelier_point: {
			materialPrice: 80,
			laborPrice: 70,
			wastagePercent: 10,
			unit: "نقطة",
		},
		led_panel: {
			materialPrice: 60,
			laborPrice: 35,
			wastagePercent: 10,
			unit: "نقطة",
		},
		outdoor_light: {
			materialPrice: 120,
			laborPrice: 50,
			wastagePercent: 10,
			unit: "نقطة",
		},
		emergency_light: {
			materialPrice: 120,
			laborPrice: 40,
			wastagePercent: 5,
			unit: "نقطة",
		},
		exit_sign: {
			materialPrice: 100,
			laborPrice: 30,
			wastagePercent: 5,
			unit: "نقطة",
		},
		outlet_13a: {
			materialPrice: 45,
			laborPrice: 40,
			wastagePercent: 10,
			unit: "نقطة",
		},
		outlet_20a_ac: {
			materialPrice: 65,
			laborPrice: 50,
			wastagePercent: 10,
			unit: "نقطة",
		},
		outlet_20a_heater: {
			materialPrice: 65,
			laborPrice: 50,
			wastagePercent: 10,
			unit: "نقطة",
		},
		outlet_20a_washer: {
			materialPrice: 65,
			laborPrice: 50,
			wastagePercent: 10,
			unit: "نقطة",
		},
		outlet_32a_oven: {
			materialPrice: 90,
			laborPrice: 60,
			wastagePercent: 10,
			unit: "نقطة",
		},
		outlet_external: {
			materialPrice: 80,
			laborPrice: 50,
			wastagePercent: 10,
			unit: "نقطة",
		},
		wire_1_5mm: {
			materialPrice: 2.5,
			laborPrice: 1.5,
			wastagePercent: 15,
			unit: "م.ط",
		},
		wire_2_5mm: {
			materialPrice: 3.5,
			laborPrice: 1.5,
			wastagePercent: 15,
			unit: "م.ط",
		},
		wire_4mm: {
			materialPrice: 5.5,
			laborPrice: 2,
			wastagePercent: 15,
			unit: "م.ط",
		},
		wire_6mm: {
			materialPrice: 8,
			laborPrice: 2.5,
			wastagePercent: 15,
			unit: "م.ط",
		},
		cable_4x16: {
			materialPrice: 35,
			laborPrice: 15,
			wastagePercent: 10,
			unit: "م.ط",
		},
		cable_4x25: {
			materialPrice: 55,
			laborPrice: 20,
			wastagePercent: 10,
			unit: "م.ط",
		},
		cable_4x35: {
			materialPrice: 75,
			laborPrice: 25,
			wastagePercent: 10,
			unit: "م.ط",
		},
		cable_4x50: {
			materialPrice: 100,
			laborPrice: 30,
			wastagePercent: 10,
			unit: "م.ط",
		},
		panel_12way: {
			materialPrice: 400,
			laborPrice: 250,
			wastagePercent: 0,
			unit: "عدد",
		},
		panel_24way: {
			materialPrice: 800,
			laborPrice: 400,
			wastagePercent: 0,
			unit: "عدد",
		},
		panel_36way: {
			materialPrice: 1200,
			laborPrice: 500,
			wastagePercent: 0,
			unit: "عدد",
		},
		main_panel: {
			materialPrice: 3000,
			laborPrice: 1500,
			wastagePercent: 0,
			unit: "عدد",
		},
		earthing_system: {
			materialPrice: 2000,
			laborPrice: 1500,
			wastagePercent: 0,
			unit: "نظام",
		},
	},
	// ═══════════════════════ السباكة ═══════════════════════
	PLUMBING: {
		supply_cold: {
			materialPrice: 25,
			laborPrice: 30,
			wastagePercent: 15,
			unit: "نقطة",
		},
		supply_hot: {
			materialPrice: 30,
			laborPrice: 30,
			wastagePercent: 15,
			unit: "نقطة",
		},
		drain_50mm: {
			materialPrice: 20,
			laborPrice: 25,
			wastagePercent: 12,
			unit: "نقطة",
		},
		drain_100mm: {
			materialPrice: 35,
			laborPrice: 35,
			wastagePercent: 12,
			unit: "نقطة",
		},
		ppr_20mm: {
			materialPrice: 5,
			laborPrice: 4,
			wastagePercent: 15,
			unit: "م.ط",
		},
		ppr_25mm: {
			materialPrice: 8,
			laborPrice: 5,
			wastagePercent: 15,
			unit: "م.ط",
		},
		ppr_32mm: {
			materialPrice: 12,
			laborPrice: 6,
			wastagePercent: 15,
			unit: "م.ط",
		},
		pvc_50mm: {
			materialPrice: 8,
			laborPrice: 5,
			wastagePercent: 12,
			unit: "م.ط",
		},
		pvc_100mm: {
			materialPrice: 15,
			laborPrice: 8,
			wastagePercent: 12,
			unit: "م.ط",
		},
		pvc_150mm: {
			materialPrice: 25,
			laborPrice: 12,
			wastagePercent: 12,
			unit: "م.ط",
		},
		tank_fiberglass: {
			materialPrice: 1200,
			laborPrice: 300,
			wastagePercent: 0,
			unit: "م³",
		},
		pump_1hp: {
			materialPrice: 1500,
			laborPrice: 500,
			wastagePercent: 0,
			unit: "عدد",
		},
		pump_2hp: {
			materialPrice: 2500,
			laborPrice: 700,
			wastagePercent: 0,
			unit: "عدد",
		},
		heater_50l: {
			materialPrice: 600,
			laborPrice: 200,
			wastagePercent: 0,
			unit: "عدد",
		},
		heater_80l: {
			materialPrice: 800,
			laborPrice: 250,
			wastagePercent: 0,
			unit: "عدد",
		},
		manhole_60x60: {
			materialPrice: 300,
			laborPrice: 250,
			wastagePercent: 0,
			unit: "عدد",
		},
		manhole_80x80: {
			materialPrice: 500,
			laborPrice: 350,
			wastagePercent: 0,
			unit: "عدد",
		},
		wc_set: {
			materialPrice: 800,
			laborPrice: 300,
			wastagePercent: 0,
			unit: "عدد",
		},
		washbasin_set: {
			materialPrice: 400,
			laborPrice: 200,
			wastagePercent: 0,
			unit: "عدد",
		},
		shower_mixer: {
			materialPrice: 300,
			laborPrice: 150,
			wastagePercent: 0,
			unit: "عدد",
		},
		kitchen_sink: {
			materialPrice: 500,
			laborPrice: 200,
			wastagePercent: 0,
			unit: "عدد",
		},
		floor_drain: {
			materialPrice: 40,
			laborPrice: 30,
			wastagePercent: 0,
			unit: "عدد",
		},
	},
	// ═══════════════════════ التكييف ═══════════════════════
	HVAC: {
		split_1ton: {
			materialPrice: 200,
			laborPrice: 300,
			wastagePercent: 0,
			unit: "وحدة",
		},
		split_1_5ton: {
			materialPrice: 250,
			laborPrice: 350,
			wastagePercent: 0,
			unit: "وحدة",
		},
		split_2ton: {
			materialPrice: 300,
			laborPrice: 400,
			wastagePercent: 0,
			unit: "وحدة",
		},
		split_2_5ton: {
			materialPrice: 350,
			laborPrice: 450,
			wastagePercent: 0,
			unit: "وحدة",
		},
		split_3ton: {
			materialPrice: 400,
			laborPrice: 500,
			wastagePercent: 0,
			unit: "وحدة",
		},
		copper_pipes: {
			materialPrice: 25,
			laborPrice: 15,
			wastagePercent: 10,
			unit: "م.ط",
		},
		condensate_pipe: {
			materialPrice: 5,
			laborPrice: 3,
			wastagePercent: 10,
			unit: "م.ط",
		},
		exhaust_fan_bath: {
			materialPrice: 150,
			laborPrice: 80,
			wastagePercent: 0,
			unit: "عدد",
		},
		exhaust_fan_kitchen: {
			materialPrice: 300,
			laborPrice: 150,
			wastagePercent: 0,
			unit: "عدد",
		},
	},
	// ═══════════════════════ الحريق ═══════════════════════
	FIREFIGHTING: {
		facp_8zone: {
			materialPrice: 5000,
			laborPrice: 2000,
			wastagePercent: 0,
			unit: "عدد",
		},
		smoke_detector: {
			materialPrice: 60,
			laborPrice: 30,
			wastagePercent: 5,
			unit: "عدد",
		},
		heat_detector: {
			materialPrice: 50,
			laborPrice: 25,
			wastagePercent: 5,
			unit: "عدد",
		},
		manual_call_point: {
			materialPrice: 80,
			laborPrice: 40,
			wastagePercent: 0,
			unit: "عدد",
		},
		horn_strobe: {
			materialPrice: 120,
			laborPrice: 50,
			wastagePercent: 0,
			unit: "عدد",
		},
		sprinkler_head: {
			materialPrice: 30,
			laborPrice: 20,
			wastagePercent: 5,
			unit: "عدد",
		},
		hose_cabinet: {
			materialPrice: 1000,
			laborPrice: 500,
			wastagePercent: 0,
			unit: "عدد",
		},
		extinguisher_abc: {
			materialPrice: 100,
			laborPrice: 0,
			wastagePercent: 0,
			unit: "عدد",
		},
		extinguisher_co2: {
			materialPrice: 200,
			laborPrice: 0,
			wastagePercent: 0,
			unit: "عدد",
		},
		fire_pump_main: {
			materialPrice: 35000,
			laborPrice: 15000,
			wastagePercent: 0,
			unit: "عدد",
		},
		jockey_pump: {
			materialPrice: 5000,
			laborPrice: 3000,
			wastagePercent: 0,
			unit: "عدد",
		},
		fire_tank: {
			materialPrice: 1500,
			laborPrice: 500,
			wastagePercent: 0,
			unit: "م³",
		},
	},
	// ═══════════════════════ التيار الخفيف ═══════════════════════
	LOW_CURRENT: {
		network_point: {
			materialPrice: 80,
			laborPrice: 50,
			wastagePercent: 10,
			unit: "نقطة",
		},
		wifi_ap: {
			materialPrice: 300,
			laborPrice: 100,
			wastagePercent: 0,
			unit: "عدد",
		},
		camera_dome: {
			materialPrice: 250,
			laborPrice: 100,
			wastagePercent: 0,
			unit: "عدد",
		},
		camera_bullet: {
			materialPrice: 300,
			laborPrice: 120,
			wastagePercent: 0,
			unit: "عدد",
		},
		nvr_8ch: {
			materialPrice: 1500,
			laborPrice: 300,
			wastagePercent: 0,
			unit: "عدد",
		},
		intercom_outdoor: {
			materialPrice: 800,
			laborPrice: 300,
			wastagePercent: 0,
			unit: "عدد",
		},
		intercom_indoor: {
			materialPrice: 400,
			laborPrice: 150,
			wastagePercent: 0,
			unit: "عدد",
		},
		speaker: {
			materialPrice: 150,
			laborPrice: 80,
			wastagePercent: 0,
			unit: "عدد",
		},
		amplifier: {
			materialPrice: 1000,
			laborPrice: 300,
			wastagePercent: 0,
			unit: "عدد",
		},
	},
	// ═══════════════════════ أنظمة خاصة ═══════════════════════
	SPECIAL: {
		elevator_6person: {
			materialPrice: 80000,
			laborPrice: 20000,
			wastagePercent: 0,
			unit: "عدد",
		},
		elevator_8person: {
			materialPrice: 100000,
			laborPrice: 25000,
			wastagePercent: 0,
			unit: "عدد",
		},
		generator_30kva: {
			materialPrice: 25000,
			laborPrice: 8000,
			wastagePercent: 0,
			unit: "عدد",
		},
		generator_100kva: {
			materialPrice: 60000,
			laborPrice: 15000,
			wastagePercent: 0,
			unit: "عدد",
		},
		generator_250kva: {
			materialPrice: 120000,
			laborPrice: 25000,
			wastagePercent: 0,
			unit: "عدد",
		},
		solar_per_kw: {
			materialPrice: 3000,
			laborPrice: 1000,
			wastagePercent: 0,
			unit: "KW",
		},
		gas_point: {
			materialPrice: 200,
			laborPrice: 150,
			wastagePercent: 10,
			unit: "نقطة",
		},
		lightning_system: {
			materialPrice: 3000,
			laborPrice: 2000,
			wastagePercent: 0,
			unit: "نظام",
		},
	},
};

/**
 * Helper: جلب سعر افتراضي لبند محدد
 */
export function getMEPDefaultPrice(
	category: string,
	itemType: string,
): MEPDefaultPrice {
	const categoryPrices = MEP_DEFAULT_PRICES[category];
	if (!categoryPrices)
		return { materialPrice: 0, laborPrice: 0, wastagePercent: 10, unit: "عدد" };
	return (
		categoryPrices[itemType] || {
			materialPrice: 0,
			laborPrice: 0,
			wastagePercent: 10,
			unit: "عدد",
		}
	);
}

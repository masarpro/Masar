// ══════════════════════════════════════════════════════════════
// Selling Units — maps subItemKeys to Saudi market selling units
// ══════════════════════════════════════════════════════════════

export interface SellingUnitConfig {
	unit: string; // وحدة البيع بالعربي
	unitEn: string; // وحدة البيع بالإنجليزي
	size: number; // حجم الوحدة (معامل التقسيم)
	baseUnit: string; // وحدة الحساب الأصلية
}

/**
 * Mapping of subItemKey → selling unit config.
 * Used to convert engineering quantities to purchasable units.
 */
export const SELLING_UNITS: Record<string, SellingUnitConfig> = {
	// ── أسمنت وخلطات ──
	cement: { unit: "كيس 50 كجم", unitEn: "50kg bag", size: 50, baseUnit: "كجم" },
	splash_cement: { unit: "كيس 50 كجم", unitEn: "50kg bag", size: 50, baseUnit: "كجم" },
	white_cement_grout: { unit: "كيس 25 كجم", unitEn: "25kg bag", size: 25, baseUnit: "كجم" },
	fine_sand: { unit: "م³", unitEn: "m³", size: 1600, baseUnit: "كجم" },
	splash_sand: { unit: "م³", unitEn: "m³", size: 1500, baseUnit: "كجم" },

	// ── لياسة ──
	ready_plaster: { unit: "كيس 30 كجم", unitEn: "30kg bag", size: 30, baseUnit: "كجم" },
	gypsum_plaster: { unit: "كيس 25 كجم", unitEn: "25kg bag", size: 25, baseUnit: "كجم" },
	gypsum_mp75: { unit: "كيس 30 كجم", unitEn: "30kg bag", size: 30, baseUnit: "كجم" },
	aluminum_beads: { unit: "قطعة 3م", unitEn: "3m piece", size: 3, baseUnit: "م.ط" },
	corner_protection: { unit: "قطعة 3م", unitEn: "3m piece", size: 3, baseUnit: "م.ط" },
	reinforcement_mesh: { unit: "رول 50م²", unitEn: "50m² roll", size: 50, baseUnit: "م²" },
	fiber_mesh: { unit: "رول 50م²", unitEn: "50m² roll", size: 50, baseUnit: "م²" },
	waterproofing_additive: { unit: "جالون 5 لتر", unitEn: "5L gallon", size: 5, baseUnit: "لتر" },

	// ── عزل مائي ──
	primer: { unit: "جالون 18 لتر", unitEn: "18L gallon", size: 18, baseUnit: "لتر" },
	bitumen_primer: { unit: "جالون 18 لتر", unitEn: "18L gallon", size: 18, baseUnit: "لتر" },
	component_a: { unit: "كيس 25 كجم", unitEn: "25kg bag", size: 25, baseUnit: "كجم" },
	component_b: { unit: "جالون 8 لتر", unitEn: "8L gallon", size: 8, baseUnit: "لتر" },
	roll_4mm: { unit: "رول 10م²", unitEn: "10m² roll", size: 10, baseUnit: "م²" },
	roll_3mm: { unit: "رول 10م²", unitEn: "10m² roll", size: 10, baseUnit: "م²" },
	mastic: { unit: "سطل 5 كجم", unitEn: "5kg bucket", size: 5, baseUnit: "كجم" },
	pu_liquid: { unit: "سطل 25 كجم", unitEn: "25kg bucket", size: 25, baseUnit: "كجم" },
	liquid_bitumen: { unit: "سطل 20 كجم", unitEn: "20kg bucket", size: 20, baseUnit: "كجم" },
	reinforcement_tape: { unit: "رول 50م", unitEn: "50m roll", size: 50, baseUnit: "م.ط" },
	epoxy_primer: { unit: "جالون 5 لتر", unitEn: "5L gallon", size: 5, baseUnit: "لتر" },
	epoxy_coating: { unit: "سطل 5 كجم", unitEn: "5kg bucket", size: 5, baseUnit: "كجم" },

	// ── عزل حراري ──
	xps_boards: { unit: "لوح 0.72م²", unitEn: "0.72m² board", size: 0.72, baseUnit: "م²" },
	eps_boards: { unit: "لوح 0.72م²", unitEn: "0.72m² board", size: 0.72, baseUnit: "م²" },
	rock_wool_boards: { unit: "لوح 0.72م²", unitEn: "0.72m² board", size: 0.72, baseUnit: "م²" },
	adhesive: { unit: "كيس 25 كجم", unitEn: "25kg bag", size: 25, baseUnit: "كجم" },
	fixing_pins: { unit: "كيس 100 عدد", unitEn: "100pc bag", size: 100, baseUnit: "عدد" },
	joint_tape: { unit: "رول 50م", unitEn: "50m roll", size: 50, baseUnit: "م.ط" },
	vapor_film: { unit: "رول 100م²", unitEn: "100m² roll", size: 100, baseUnit: "م²" },
	aluminum_tape: { unit: "رول 50م", unitEn: "50m roll", size: 50, baseUnit: "م.ط" },
	pu_spray: { unit: "برميل 200 كجم", unitEn: "200kg drum", size: 200, baseUnit: "كجم" },

	// ── دهان ──
	base_putty: { unit: "كيس 20 كجم", unitEn: "20kg bag", size: 20, baseUnit: "كجم" },
	fine_putty: { unit: "سطل 18 كجم", unitEn: "18kg bucket", size: 18, baseUnit: "كجم" },
	putty: { unit: "سطل 20 كجم", unitEn: "20kg bucket", size: 20, baseUnit: "كجم" },
	sandpaper: { unit: "ربطة 50 ورقة", unitEn: "50-sheet pack", size: 50, baseUnit: "ورقة" },
	final_paint: { unit: "سطل 18 لتر", unitEn: "18L bucket", size: 18, baseUnit: "لتر" },
	acrylic_primer: { unit: "سطل 18 لتر", unitEn: "18L bucket", size: 18, baseUnit: "لتر" },
	acrylic_paint: { unit: "سطل 18 لتر", unitEn: "18L bucket", size: 18, baseUnit: "لتر" },
	special_primer: { unit: "سطل 18 لتر", unitEn: "18L bucket", size: 18, baseUnit: "لتر" },
	velvet_paint: { unit: "جالون 3.6 لتر", unitEn: "3.6L gallon", size: 3.6, baseUnit: "لتر" },
	texture_material: { unit: "سطل 25 كجم", unitEn: "25kg bucket", size: 25, baseUnit: "كجم" },
	masking_tape: { unit: "رول 50م", unitEn: "50m roll", size: 50, baseUnit: "م.ط" },
	protection_nylon: { unit: "رول 200م²", unitEn: "200m² roll", size: 200, baseUnit: "م²" },
	exterior_primer: { unit: "سطل 18 لتر", unitEn: "18L bucket", size: 18, baseUnit: "لتر" },
	exterior_paint: { unit: "سطل 18 لتر", unitEn: "18L bucket", size: 18, baseUnit: "لتر" },
	elastomeric_paint: { unit: "سطل 18 لتر", unitEn: "18L bucket", size: 18, baseUnit: "لتر" },
	paint: { unit: "سطل 18 لتر", unitEn: "18L bucket", size: 18, baseUnit: "لتر" },
	iron_paint: { unit: "علبة 4 لتر", unitEn: "4L can", size: 4, baseUnit: "لتر" },
	varnish: { unit: "علبة 4 لتر", unitEn: "4L can", size: 4, baseUnit: "لتر" },

	// ── بلاط وأرضيات ──
	grout: { unit: "كيس 3 كجم", unitEn: "3kg bag", size: 3, baseUnit: "كجم" },
	crosses: { unit: "كيس 200 عدد", unitEn: "200pc bag", size: 200, baseUnit: "عدد" },
	skirting: { unit: "قطعة 60سم", unitEn: "60cm piece", size: 0.6, baseUnit: "م.ط" },
	pvc_skirting: { unit: "قطعة 2.4م", unitEn: "2.4m piece", size: 2.4, baseUnit: "م.ط" },
	aluminum_corners: { unit: "قطعة 2.5م", unitEn: "2.5m piece", size: 2.5, baseUnit: "م.ط" },
	pvc_corners: { unit: "قطعة 2.5م", unitEn: "2.5m piece", size: 2.5, baseUnit: "م.ط" },
	silicone: { unit: "أنبوب 280مل", unitEn: "280ml tube", size: 12, baseUnit: "م.ط" },
	silicone_joints: { unit: "أنبوب 280مل", unitEn: "280ml tube", size: 12, baseUnit: "م.ط" },
	cement_mix: { unit: "كيس 25 كجم", unitEn: "25kg bag", size: 25, baseUnit: "كجم" },
	foam_underlay: { unit: "رول 15م²", unitEn: "15m² roll", size: 15, baseUnit: "م²" },
	edge_strip: { unit: "قطعة 2.5م", unitEn: "2.5m piece", size: 2.5, baseUnit: "م.ط" },
	vinyl_adhesive: { unit: "سطل 5 كجم", unitEn: "5kg bucket", size: 5, baseUnit: "كجم" },
	outdoor_adhesive: { unit: "كيس 25 كجم", unitEn: "25kg bag", size: 25, baseUnit: "كجم" },

	// ── جبس بورد وأسقف ──
	gypsum_boards: { unit: "لوح 2.88م²", unitEn: "2.88m² board", size: 2.88, baseUnit: "م²" },
	main_profile: { unit: "قطعة 3.6م", unitEn: "3.6m piece", size: 3.6, baseUnit: "م.ط" },
	secondary_profile: { unit: "قطعة 1.2م", unitEn: "1.2m piece", size: 1.2, baseUnit: "م.ط" },
	t_profile: { unit: "قطعة 3.6م", unitEn: "3.6m piece", size: 3.6, baseUnit: "م.ط" },
	wall_profile: { unit: "قطعة 3م", unitEn: "3m piece", size: 3, baseUnit: "م.ط" },
	hangers: { unit: "كيس 100 عدد", unitEn: "100pc bag", size: 100, baseUnit: "عدد" },
	hanging_wire: { unit: "كيس 100 عدد", unitEn: "100pc bag", size: 100, baseUnit: "عدد" },
	drywall_screws: { unit: "علبة 500 عدد", unitEn: "500pc box", size: 500, baseUnit: "عدد" },

	// ── أبواب ──
	door_leaf: { unit: "عدد", unitEn: "piece", size: 1, baseUnit: "عدد" },
	frame: { unit: "طقم", unitEn: "set", size: 1, baseUnit: "طقم" },
	wood_frame: { unit: "طقم", unitEn: "set", size: 1, baseUnit: "طقم" },
	lock: { unit: "عدد", unitEn: "piece", size: 1, baseUnit: "عدد" },
	hinges: { unit: "طقم 3", unitEn: "set of 3", size: 3, baseUnit: "عدد" },
	brass_hinges: { unit: "طقم 3", unitEn: "set of 3", size: 3, baseUnit: "عدد" },
	handle: { unit: "عدد", unitEn: "piece", size: 1, baseUnit: "عدد" },
	stopper: { unit: "عدد", unitEn: "piece", size: 1, baseUnit: "عدد" },
	fixing_kit: { unit: "طقم", unitEn: "set", size: 1, baseUnit: "طقم" },
	molding: { unit: "قطعة 2.5م", unitEn: "2.5m piece", size: 2.5, baseUnit: "م.ط" },

	// ── نوافذ ──
	aluminum_frame: { unit: "قطاع 6م", unitEn: "6m profile", size: 6, baseUnit: "م.ط" },
	upvc_frame: { unit: "قطاع 6م", unitEn: "6m profile", size: 6, baseUnit: "م.ط" },
	rubber_seal: { unit: "رول 100م", unitEn: "100m roll", size: 100, baseUnit: "م.ط" },
	screws: { unit: "كيس 100 عدد", unitEn: "100pc bag", size: 100, baseUnit: "عدد" },
	fixing_screws: { unit: "كيس 100 عدد", unitEn: "100pc bag", size: 100, baseUnit: "عدد" },

	// ── واجهات حجرية ──
	adhesive_mix: { unit: "كيس 25 كجم", unitEn: "25kg bag", size: 25, baseUnit: "كجم" },
	stone_adhesive: { unit: "كيس 25 كجم", unitEn: "25kg bag", size: 25, baseUnit: "كجم" },
	tie_wire: { unit: "لفة 20 كجم", unitEn: "20kg roll", size: 20, baseUnit: "كجم" },
	joint_mortar: { unit: "كيس 25 كجم", unitEn: "25kg bag", size: 25, baseUnit: "كجم" },
	protection_material: { unit: "جالون 5 لتر", unitEn: "5L gallon", size: 5, baseUnit: "لتر" },
	protection_varnish: { unit: "جالون 5 لتر", unitEn: "5L gallon", size: 5, baseUnit: "لتر" },

	// ── إنترلوك ──
	joint_sand: { unit: "كيس 50 كجم", unitEn: "50kg bag", size: 50, baseUnit: "كجم" },
	curbs: { unit: "قطعة 1م", unitEn: "1m piece", size: 1, baseUnit: "م.ط" },

	// ── درابزين ──
	clips: { unit: "كيس 100 عدد", unitEn: "100pc bag", size: 100, baseUnit: "عدد" },

	// ── PU فوم ──
	pu_foam: { unit: "أنبوب 750مل", unitEn: "750ml can", size: 10, baseUnit: "م.ط" },
};

/**
 * Gets the selling unit config for a given subItemKey.
 * Returns undefined if no mapping exists (item sold as-is).
 */
export function getSellingUnit(subItemKey: string): SellingUnitConfig | undefined {
	return SELLING_UNITS[subItemKey];
}

/**
 * Calculates selling quantity (always rounds up — can't buy half a bag).
 */
export function calcSellingQuantity(quantity: number, unitSize: number): number {
	if (unitSize <= 0) return quantity;
	return Math.ceil(quantity / unitSize);
}

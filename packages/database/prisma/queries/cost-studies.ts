import { db } from "../client";

// ═══════════════════════════════════════════════════════════════════════════
// Cost Study Queries - استعلامات دراسة التكلفة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all cost studies for an organization
 */
export async function getOrganizationCostStudies(
	organizationId: string,
	options?: {
		status?: string;
		limit?: number;
		offset?: number;
		query?: string;
	},
) {
	const where: {
		organizationId: string;
		status?: string;
		OR?: Array<{ name?: { contains: string; mode: "insensitive" }; customerName?: { contains: string; mode: "insensitive" } }>;
	} = { organizationId };

	if (options?.status) {
		where.status = options.status;
	}

	if (options?.query) {
		where.OR = [
			{ name: { contains: options.query, mode: "insensitive" } },
			{ customerName: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [costStudies, total] = await Promise.all([
		db.costStudy.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
				lead: { select: { id: true, name: true, status: true } },
				_count: {
					select: {
						structuralItems: true,
						finishingItems: true,
						mepItems: true,
						laborItems: true,
						quotes: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.costStudy.count({ where }),
	]);

	return { costStudies, total };
}

/**
 * Get a single cost study by ID with all related items
 */
export async function getCostStudyById(id: string, organizationId: string) {
	return db.costStudy.findFirst({
		where: { id, organizationId },
		include: {
			structuralItems: { orderBy: { sortOrder: "asc" } },
			finishingItems: { orderBy: { sortOrder: "asc" } },
			mepItems: { orderBy: { sortOrder: "asc" } },
			laborItems: true,
			quotes: { orderBy: { createdAt: "desc" } },
			createdBy: { select: { id: true, name: true, email: true } },
			lead: { select: { id: true, name: true, phone: true, status: true, priority: true } },
		},
	});
}

/**
 * Create a new cost study
 */
export async function createCostStudy(data: {
	organizationId: string;
	createdById: string;
	name?: string;
	customerName?: string;
	customerId?: string;
	projectType: string;
	landArea: number;
	buildingArea: number;
	numberOfFloors: number;
	hasBasement?: boolean;
	finishingLevel: string;
}) {
	return db.costStudy.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			name: data.name,
			customerName: data.customerName,
			customerId: data.customerId,
			projectType: data.projectType,
			landArea: data.landArea,
			buildingArea: data.buildingArea,
			numberOfFloors: data.numberOfFloors,
			hasBasement: data.hasBasement ?? false,
			finishingLevel: data.finishingLevel,
		},
	});
}

/**
 * Update a cost study
 */
export async function updateCostStudy(
	id: string,
	organizationId: string,
	data: Partial<{
		name: string;
		customerName: string;
		customerId: string;
		projectType: string;
		landArea: number;
		buildingArea: number;
		numberOfFloors: number;
		hasBasement: boolean;
		finishingLevel: string;
		overheadPercent: number;
		profitPercent: number;
		contingencyPercent: number;
		vatIncluded: boolean;
		status: string;
		notes: string;
	}>,
) {
	// Verify ownership first
	const existing = await db.costStudy.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Cost study not found");
	}

	return db.costStudy.update({
		where: { id },
		data,
	});
}

/**
 * Delete a cost study and all related items
 */
export async function deleteCostStudy(id: string, organizationId: string) {
	// Verify ownership first
	const existing = await db.costStudy.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Cost study not found");
	}

	return db.costStudy.delete({
		where: { id },
	});
}

/**
 * Duplicate a cost study with all items
 */
export async function duplicateCostStudy(
	id: string,
	organizationId: string,
	createdById: string,
) {
	const original = await getCostStudyById(id, organizationId);

	if (!original) {
		throw new Error("Cost study not found");
	}

	return db.$transaction(async (tx) => {
		// Create new cost study
		const newStudy = await tx.costStudy.create({
			data: {
				organizationId,
				createdById,
				name: original.name ? `${original.name} (نسخة)` : "نسخة",
				customerName: original.customerName,
				customerId: original.customerId,
				projectType: original.projectType,
				landArea: original.landArea,
				buildingArea: original.buildingArea,
				numberOfFloors: original.numberOfFloors,
				hasBasement: original.hasBasement,
				finishingLevel: original.finishingLevel,
				buildingConfig: original.buildingConfig ?? undefined,
				overheadPercent: original.overheadPercent,
				profitPercent: original.profitPercent,
				contingencyPercent: original.contingencyPercent,
				vatIncluded: original.vatIncluded,
				status: "draft",
			},
		});

		// Copy structural items
		if (original.structuralItems.length > 0) {
			await tx.structuralItem.createMany({
				data: original.structuralItems.map((item) => ({
					costStudyId: newStudy.id,
					category: item.category,
					subCategory: item.subCategory,
					name: item.name,
					description: item.description,
					dimensions: item.dimensions ?? undefined,
					quantity: item.quantity,
					unit: item.unit,
					concreteVolume: item.concreteVolume,
					concreteType: item.concreteType,
					steelWeight: item.steelWeight,
					steelRatio: item.steelRatio,
					wastagePercent: item.wastagePercent,
					materialCost: item.materialCost,
					laborCost: item.laborCost,
					totalCost: item.totalCost,
					sortOrder: item.sortOrder,
				})),
			});
		}

		// Copy finishing items
		if (original.finishingItems.length > 0) {
			await tx.finishingItem.createMany({
				data: original.finishingItems.map((item) => ({
					costStudyId: newStudy.id,
					category: item.category,
					subCategory: item.subCategory,
					name: item.name,
					description: item.description,
					floorId: item.floorId,
					floorName: item.floorName,
					area: item.area,
					length: item.length,
					height: item.height,
					width: item.width,
					perimeter: item.perimeter,
					quantity: item.quantity,
					unit: item.unit,
					calculationMethod: item.calculationMethod,
					calculationData: item.calculationData ?? undefined,
					qualityLevel: item.qualityLevel,
					brand: item.brand,
					specifications: item.specifications,
					wastagePercent: item.wastagePercent,
					materialPrice: item.materialPrice,
					laborPrice: item.laborPrice,
					materialCost: item.materialCost,
					laborCost: item.laborCost,
					totalCost: item.totalCost,
					sortOrder: item.sortOrder,
				})),
			});
		}

		// Copy MEP items
		if (original.mepItems.length > 0) {
			await tx.mEPItem.createMany({
				data: original.mepItems.map((item) => ({
					costStudyId: newStudy.id,
					category: item.category,
					subCategory: item.subCategory,
					itemType: item.itemType,
					name: item.name,
					floorId: item.floorId,
					floorName: item.floorName,
					roomId: item.roomId,
					roomName: item.roomName,
					scope: item.scope,
					quantity: item.quantity,
					unit: item.unit,
					length: item.length,
					area: item.area,
					calculationMethod: item.calculationMethod,
					calculationData: item.calculationData ?? undefined,
					dataSource: item.dataSource,
					sourceFormula: item.sourceFormula,
					groupKey: item.groupKey,
					specifications: item.specifications,
					specData: item.specData ?? undefined,
					qualityLevel: item.qualityLevel,
					materialPrice: item.materialPrice,
					laborPrice: item.laborPrice,
					wastagePercent: item.wastagePercent,
					materialCost: item.materialCost,
					laborCost: item.laborCost,
					unitPrice: item.unitPrice,
					totalCost: item.totalCost,
					sortOrder: item.sortOrder,
					isEnabled: item.isEnabled,
				})),
			});
		}

		// Copy labor items
		if (original.laborItems.length > 0) {
			await tx.laborItem.createMany({
				data: original.laborItems.map((item) => ({
					costStudyId: newStudy.id,
					laborType: item.laborType,
					workerType: item.workerType,
					name: item.name,
					quantity: item.quantity,
					dailyRate: item.dailyRate,
					durationDays: item.durationDays,
					insuranceCost: item.insuranceCost,
					housingCost: item.housingCost,
					otherCosts: item.otherCosts,
					totalCost: item.totalCost,
				})),
			});
		}

		// Recalculate totals for new study
		await recalculateCostStudyTotals(newStudy.id);

		return newStudy;
	});
}

/**
 * Recalculate all cost totals for a study
 */
export async function recalculateCostStudyTotals(id: string) {
	const [structural, finishing, mep, labor] = await Promise.all([
		db.structuralItem.aggregate({
			where: { costStudyId: id },
			_sum: { totalCost: true },
		}),
		db.finishingItem.aggregate({
			where: { costStudyId: id },
			_sum: { totalCost: true },
		}),
		db.mEPItem.aggregate({
			where: { costStudyId: id, isEnabled: true },
			_sum: { totalCost: true },
		}),
		db.laborItem.aggregate({
			where: { costStudyId: id },
			_sum: { totalCost: true },
		}),
	]);

	const structuralCost = Number(structural._sum.totalCost ?? 0);
	const finishingCost = Number(finishing._sum.totalCost ?? 0);
	const mepCost = Number(mep._sum.totalCost ?? 0);
	const laborCost = Number(labor._sum.totalCost ?? 0);

	const study = await db.costStudy.findUnique({
		where: { id },
		select: {
			overheadPercent: true,
			profitPercent: true,
			contingencyPercent: true,
			vatIncluded: true,
		},
	});

	if (!study) return;

	const subtotal = structuralCost + finishingCost + mepCost + laborCost;
	const overhead = subtotal * (Number(study.overheadPercent) / 100);
	const profit = subtotal * (Number(study.profitPercent) / 100);
	const contingency = subtotal * (Number(study.contingencyPercent) / 100);
	const beforeVat = subtotal + overhead + profit + contingency;
	const vat = study.vatIncluded ? beforeVat * 0.15 : 0;
	const totalCost = beforeVat + vat;

	await db.costStudy.update({
		where: { id },
		data: {
			structuralCost,
			finishingCost,
			mepCost,
			laborCost,
			totalCost,
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Structural Item Queries
// ═══════════════════════════════════════════════════════════════════════════

export async function createStructuralItem(data: {
	costStudyId: string;
	category: string;
	subCategory?: string;
	name: string;
	description?: string;
	dimensions?: unknown;
	quantity: number;
	unit: string;
	concreteVolume?: number;
	concreteType?: string;
	steelWeight?: number;
	steelRatio?: number;
	wastagePercent?: number;
	materialCost?: number;
	laborCost?: number;
	totalCost?: number;
}) {
	const item = await db.structuralItem.create({
		data: {
			costStudyId: data.costStudyId,
			category: data.category,
			subCategory: data.subCategory,
			name: data.name,
			description: data.description,
			dimensions: data.dimensions as object,
			quantity: data.quantity,
			unit: data.unit,
			concreteVolume: data.concreteVolume,
			concreteType: data.concreteType,
			steelWeight: data.steelWeight,
			steelRatio: data.steelRatio,
			wastagePercent: data.wastagePercent ?? 10,
			materialCost: data.materialCost ?? 0,
			laborCost: data.laborCost ?? 0,
			totalCost: data.totalCost ?? 0,
		},
	});

	// Recalculate parent totals
	await recalculateCostStudyTotals(data.costStudyId);

	return item;
}

export async function updateStructuralItem(
	id: string,
	costStudyId: string,
	data: Partial<{
		category: string;
		subCategory: string;
		name: string;
		description: string;
		dimensions: unknown;
		quantity: number;
		unit: string;
		concreteVolume: number;
		concreteType: string;
		steelWeight: number;
		steelRatio: number;
		wastagePercent: number;
		materialCost: number;
		laborCost: number;
		totalCost: number;
		sortOrder: number;
	}>,
) {
	const item = await db.structuralItem.update({
		where: { id },
		data: data as object,
	});

	// Recalculate parent totals
	await recalculateCostStudyTotals(costStudyId);

	return item;
}

export async function deleteStructuralItem(id: string, costStudyId: string) {
	await db.structuralItem.delete({
		where: { id },
	});

	// Recalculate parent totals
	await recalculateCostStudyTotals(costStudyId);
}

// ═══════════════════════════════════════════════════════════════════════════
// Finishing Item Queries
// ═══════════════════════════════════════════════════════════════════════════

export async function createFinishingItem(data: {
	costStudyId: string;
	category: string;
	subCategory?: string;
	name: string;
	description?: string;
	floorId?: string;
	floorName?: string;
	area?: number;
	length?: number;
	height?: number;
	width?: number;
	perimeter?: number;
	quantity?: number;
	unit: string;
	calculationMethod?: string;
	calculationData?: unknown;
	qualityLevel?: string;
	brand?: string;
	specifications?: string;
	wastagePercent?: number;
	materialPrice?: number;
	laborPrice?: number;
	materialCost?: number;
	laborCost?: number;
	totalCost?: number;
	dataSource?: string;
	sourceItemId?: string;
	sourceFormula?: string;
	isEnabled?: boolean;
	sortOrder?: number;
	groupKey?: string;
	scope?: string;
}) {
	const item = await db.finishingItem.create({
		data: {
			costStudyId: data.costStudyId,
			category: data.category,
			subCategory: data.subCategory,
			name: data.name,
			description: data.description,
			floorId: data.floorId,
			floorName: data.floorName,
			area: data.area,
			length: data.length,
			height: data.height,
			width: data.width,
			perimeter: data.perimeter,
			quantity: data.quantity,
			unit: data.unit,
			calculationMethod: data.calculationMethod,
			calculationData: data.calculationData as object,
			qualityLevel: data.qualityLevel,
			brand: data.brand,
			specifications: data.specifications,
			wastagePercent: data.wastagePercent ?? 0,
			materialPrice: data.materialPrice ?? 0,
			laborPrice: data.laborPrice ?? 0,
			materialCost: data.materialCost ?? 0,
			laborCost: data.laborCost ?? 0,
			totalCost: data.totalCost ?? 0,
			dataSource: data.dataSource,
			sourceItemId: data.sourceItemId,
			sourceFormula: data.sourceFormula,
			isEnabled: data.isEnabled ?? true,
			sortOrder: data.sortOrder ?? 0,
			groupKey: data.groupKey,
			scope: data.scope,
		},
	});

	await recalculateCostStudyTotals(data.costStudyId);

	return item;
}

export async function createFinishingItemsBatch(
	costStudyId: string,
	items: Array<{
		category: string;
		subCategory?: string;
		name: string;
		description?: string;
		floorId?: string;
		floorName?: string;
		area?: number;
		length?: number;
		height?: number;
		width?: number;
		perimeter?: number;
		quantity?: number;
		unit: string;
		calculationMethod?: string;
		calculationData?: unknown;
		qualityLevel?: string;
		brand?: string;
		specifications?: string;
		wastagePercent?: number;
		materialPrice?: number;
		laborPrice?: number;
		materialCost?: number;
		laborCost?: number;
		totalCost?: number;
		dataSource?: string;
		sourceItemId?: string;
		sourceFormula?: string;
		isEnabled?: boolean;
		sortOrder?: number;
		groupKey?: string;
		scope?: string;
	}>,
) {
	await db.finishingItem.createMany({
		data: items.map((item) => ({
			costStudyId,
			category: item.category,
			subCategory: item.subCategory,
			name: item.name,
			description: item.description,
			floorId: item.floorId,
			floorName: item.floorName,
			area: item.area,
			length: item.length,
			height: item.height,
			width: item.width,
			perimeter: item.perimeter,
			quantity: item.quantity,
			unit: item.unit,
			calculationMethod: item.calculationMethod,
			calculationData: item.calculationData as object,
			qualityLevel: item.qualityLevel,
			brand: item.brand,
			specifications: item.specifications,
			wastagePercent: item.wastagePercent ?? 0,
			materialPrice: item.materialPrice ?? 0,
			laborPrice: item.laborPrice ?? 0,
			materialCost: item.materialCost ?? 0,
			laborCost: item.laborCost ?? 0,
			totalCost: item.totalCost ?? 0,
			dataSource: item.dataSource,
			sourceItemId: item.sourceItemId,
			sourceFormula: item.sourceFormula,
			isEnabled: item.isEnabled ?? true,
			sortOrder: item.sortOrder ?? 0,
			groupKey: item.groupKey,
			scope: item.scope,
		})),
	});

	await recalculateCostStudyTotals(costStudyId);
}

export async function updateFinishingItem(
	id: string,
	costStudyId: string,
	data: Partial<{
		category: string;
		subCategory: string;
		name: string;
		description: string;
		floorId: string;
		floorName: string;
		area: number;
		length: number;
		height: number;
		width: number;
		perimeter: number;
		quantity: number;
		unit: string;
		calculationMethod: string;
		calculationData: unknown;
		qualityLevel: string;
		brand: string;
		specifications: string;
		specData: unknown;
		wastagePercent: number;
		materialPrice: number;
		laborPrice: number;
		materialCost: number;
		laborCost: number;
		totalCost: number;
		sortOrder: number;
		dataSource: string;
		sourceItemId: string;
		sourceFormula: string;
		isEnabled: boolean;
		groupKey: string;
		scope: string;
	}>,
) {
	const item = await db.finishingItem.update({
		where: { id },
		data: data as object,
	});

	await recalculateCostStudyTotals(costStudyId);

	return item;
}

export async function deleteFinishingItem(id: string, costStudyId: string) {
	await db.finishingItem.delete({
		where: { id },
	});

	await recalculateCostStudyTotals(costStudyId);
}

export async function reorderFinishingItems(
	costStudyId: string,
	items: Array<{ id: string; sortOrder: number }>,
) {
	await db.$transaction(
		items.map((item) =>
			db.finishingItem.update({
				where: { id: item.id },
				data: { sortOrder: item.sortOrder },
			}),
		),
	);
}

export async function updateBuildingConfig(
	id: string,
	organizationId: string,
	buildingConfig: unknown,
) {
	const existing = await db.costStudy.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Cost study not found");
	}

	return db.costStudy.update({
		where: { id },
		data: { buildingConfig: buildingConfig as object },
	});
}

/**
 * Get all finishing items for a cost study (for cascade update).
 */
export async function getFinishingItemsForCascade(costStudyId: string) {
	return db.finishingItem.findMany({
		where: { costStudyId },
		select: {
			id: true,
			category: true,
			floorId: true,
			area: true,
			quantity: true,
			length: true,
			unit: true,
			wastagePercent: true,
			materialPrice: true,
			laborPrice: true,
			calculationData: true,
		},
	});
}

/**
 * Batch update finishing items (for cascade update after building config change).
 */
export async function batchUpdateFinishingItems(
	costStudyId: string,
	updates: Array<{
		id: string;
		area?: number;
		quantity?: number;
		length?: number;
		totalCost: number;
		materialCost: number;
		laborCost: number;
	}>,
) {
	if (updates.length === 0) return;

	await db.$transaction(
		updates.map((update) =>
			db.finishingItem.update({
				where: { id: update.id },
				data: {
					area: update.area,
					quantity: update.quantity,
					length: update.length,
					totalCost: update.totalCost,
					materialCost: update.materialCost,
					laborCost: update.laborCost,
				},
			}),
		),
	);

	await recalculateCostStudyTotals(costStudyId);
}

// ═══════════════════════════════════════════════════════════════════════════
// MEP Item Queries
// ═══════════════════════════════════════════════════════════════════════════

export async function createMEPItem(data: {
	costStudyId: string;
	category: string;
	subCategory?: string;
	itemType?: string | null;
	name: string;
	floorId?: string | null;
	floorName?: string | null;
	roomId?: string | null;
	roomName?: string | null;
	scope?: string;
	quantity?: number;
	unit?: string;
	length?: number | null;
	area?: number | null;
	calculationMethod?: string;
	calculationData?: any;
	dataSource?: string;
	sourceFormula?: string | null;
	groupKey?: string | null;
	specifications?: string | null;
	specData?: any;
	qualityLevel?: string | null;
	materialPrice?: number;
	laborPrice?: number;
	wastagePercent?: number;
	isEnabled?: boolean;
	sortOrder?: number;
}) {
	const quantity = data.quantity ?? 0;
	const materialPrice = data.materialPrice ?? 0;
	const laborPrice = data.laborPrice ?? 0;
	const wastagePercent = data.wastagePercent ?? 10;
	const wastageMultiplier = 1 + wastagePercent / 100;

	const materialCost = quantity * materialPrice * wastageMultiplier;
	const laborCost = quantity * laborPrice;
	const unitPrice = materialPrice + laborPrice;
	const totalCost = materialCost + laborCost;

	const item = await db.mEPItem.create({
		data: {
			costStudyId: data.costStudyId,
			category: data.category,
			subCategory: data.subCategory ?? "general",
			itemType: data.itemType,
			name: data.name,
			floorId: data.floorId,
			floorName: data.floorName,
			roomId: data.roomId,
			roomName: data.roomName,
			scope: data.scope ?? "per_room",
			quantity,
			unit: data.unit ?? "عدد",
			length: data.length,
			area: data.area,
			calculationMethod: data.calculationMethod ?? "manual",
			calculationData: data.calculationData,
			dataSource: data.dataSource ?? "manual",
			sourceFormula: data.sourceFormula,
			groupKey: data.groupKey,
			specifications: data.specifications,
			specData: data.specData,
			qualityLevel: data.qualityLevel,
			materialPrice,
			laborPrice,
			wastagePercent,
			materialCost,
			laborCost,
			unitPrice,
			totalCost,
			isEnabled: data.isEnabled ?? true,
			sortOrder: data.sortOrder ?? 0,
		},
	});

	await recalculateCostStudyTotals(data.costStudyId);

	return item;
}

export async function createMEPItemsBatch(
	costStudyId: string,
	items: Array<{
		category: string;
		subCategory?: string;
		itemType?: string | null;
		name: string;
		floorId?: string | null;
		floorName?: string | null;
		roomId?: string | null;
		roomName?: string | null;
		scope?: string;
		quantity?: number;
		unit?: string;
		length?: number | null;
		area?: number | null;
		calculationMethod?: string;
		calculationData?: any;
		dataSource?: string;
		sourceFormula?: string | null;
		groupKey?: string | null;
		specifications?: string | null;
		specData?: any;
		qualityLevel?: string | null;
		materialPrice?: number;
		laborPrice?: number;
		wastagePercent?: number;
		isEnabled?: boolean;
		sortOrder?: number;
	}>,
) {
	await db.mEPItem.createMany({
		data: items.map((item) => {
			const quantity = item.quantity ?? 0;
			const materialPrice = item.materialPrice ?? 0;
			const laborPrice = item.laborPrice ?? 0;
			const wastagePercent = item.wastagePercent ?? 10;
			const wastageMultiplier = 1 + wastagePercent / 100;

			const materialCost = quantity * materialPrice * wastageMultiplier;
			const laborCost = quantity * laborPrice;
			const unitPrice = materialPrice + laborPrice;
			const totalCost = materialCost + laborCost;

			return {
				costStudyId,
				category: item.category,
				subCategory: item.subCategory ?? "general",
				itemType: item.itemType,
				name: item.name,
				floorId: item.floorId,
				floorName: item.floorName,
				roomId: item.roomId,
				roomName: item.roomName,
				scope: item.scope ?? "per_room",
				quantity,
				unit: item.unit ?? "عدد",
				length: item.length,
				area: item.area,
				calculationMethod: item.calculationMethod ?? "manual",
				calculationData: item.calculationData,
				dataSource: item.dataSource ?? "manual",
				sourceFormula: item.sourceFormula,
				groupKey: item.groupKey,
				specifications: item.specifications,
				specData: item.specData,
				qualityLevel: item.qualityLevel,
				materialPrice,
				laborPrice,
				wastagePercent,
				materialCost,
				laborCost,
				unitPrice,
				totalCost,
				isEnabled: item.isEnabled ?? true,
				sortOrder: item.sortOrder ?? 0,
			};
		}),
	});

	await recalculateCostStudyTotals(costStudyId);
}

export async function updateMEPItem(
	id: string,
	costStudyId: string,
	data: {
		category?: string;
		subCategory?: string;
		itemType?: string | null;
		name?: string;
		floorId?: string | null;
		floorName?: string | null;
		roomId?: string | null;
		roomName?: string | null;
		scope?: string;
		quantity?: number;
		unit?: string;
		length?: number | null;
		area?: number | null;
		calculationMethod?: string;
		calculationData?: any;
		dataSource?: string;
		sourceFormula?: string | null;
		groupKey?: string | null;
		specifications?: string | null;
		specData?: any;
		qualityLevel?: string | null;
		materialPrice?: number;
		laborPrice?: number;
		wastagePercent?: number;
		isEnabled?: boolean;
		sortOrder?: number;
	},
) {
	// حساب التكاليف
	const quantity = data.quantity ?? 0;
	const materialPrice = data.materialPrice ?? 0;
	const laborPrice = data.laborPrice ?? 0;
	const wastagePercent = data.wastagePercent ?? 10;
	const wastageMultiplier = 1 + wastagePercent / 100;

	const materialCost = quantity * materialPrice * wastageMultiplier;
	const laborCost = quantity * laborPrice;
	const unitPrice = materialPrice + laborPrice;
	const totalCost = materialCost + laborCost;

	// إذا عدّل المستخدم بند auto → يتحول لـ manual
	const dataSource =
		data.dataSource === "auto" && data.quantity !== undefined
			? "manual"
			: data.dataSource;

	const item = await db.mEPItem.update({
		where: { id },
		data: {
			...data,
			dataSource: dataSource ?? undefined,
			materialCost,
			laborCost,
			unitPrice,
			totalCost,
		},
	});

	await recalculateCostStudyTotals(costStudyId);
	return item;
}

export async function deleteMEPItem(id: string, costStudyId: string) {
	const item = await db.mEPItem.delete({
		where: { id },
	});

	await recalculateCostStudyTotals(costStudyId);
	return item;
}

export async function toggleMEPItemEnabled(
	id: string,
	costStudyId: string,
	isEnabled: boolean,
) {
	const item = await db.mEPItem.update({
		where: { id },
		data: { isEnabled },
	});

	await recalculateCostStudyTotals(costStudyId);
	return item;
}

export async function deleteAutoMEPItems(costStudyId: string) {
	return db.mEPItem.deleteMany({
		where: {
			costStudyId,
			dataSource: "auto",
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Labor Item Queries
// ═══════════════════════════════════════════════════════════════════════════

export async function createLaborItem(data: {
	costStudyId: string;
	laborType: string;
	workerType: string;
	name: string;
	quantity: number;
	dailyRate: number;
	durationDays: number;
	insuranceCost?: number;
	housingCost?: number;
	otherCosts?: number;
	totalCost?: number;
}) {
	const item = await db.laborItem.create({
		data: {
			costStudyId: data.costStudyId,
			laborType: data.laborType,
			workerType: data.workerType,
			name: data.name,
			quantity: data.quantity,
			dailyRate: data.dailyRate,
			durationDays: data.durationDays,
			insuranceCost: data.insuranceCost ?? 0,
			housingCost: data.housingCost ?? 0,
			otherCosts: data.otherCosts ?? 0,
			totalCost: data.totalCost ?? 0,
		},
	});

	await recalculateCostStudyTotals(data.costStudyId);

	return item;
}

export async function deleteLaborItem(id: string, costStudyId: string) {
	await db.laborItem.delete({
		where: { id },
	});

	await recalculateCostStudyTotals(costStudyId);
}

// ═══════════════════════════════════════════════════════════════════════════
// Quote Queries
// ═══════════════════════════════════════════════════════════════════════════

export async function createQuote(data: {
	costStudyId: string;
	quoteType: string;
	clientName: string;
	clientCompany?: string;
	clientPhone?: string;
	clientEmail?: string;
	clientAddress?: string;
	subtotal: number;
	overheadAmount?: number;
	profitAmount?: number;
	vatAmount?: number;
	totalAmount: number;
	validUntil: Date;
	paymentTerms?: string;
	deliveryTerms?: string;
	showUnitPrices?: boolean;
	showQuantities?: boolean;
	showItemDescriptions?: boolean;
	includeTerms?: boolean;
	includeCoverPage?: boolean;
	selectedCategories?: unknown;
	termsAndConditions?: string;
	notes?: string;
}) {
	// Generate quote number: QT-YYYY-NNNN
	const year = new Date().getFullYear();
	const count = await db.quote.count({
		where: {
			quoteNumber: {
				startsWith: `QT-${year}-`,
			},
		},
	});
	const quoteNumber = `QT-${year}-${String(count + 1).padStart(4, "0")}`;

	return db.quote.create({
		data: {
			costStudyId: data.costStudyId,
			quoteNumber,
			quoteType: data.quoteType,
			clientName: data.clientName,
			clientCompany: data.clientCompany,
			clientPhone: data.clientPhone,
			clientEmail: data.clientEmail,
			clientAddress: data.clientAddress,
			subtotal: data.subtotal,
			overheadAmount: data.overheadAmount ?? 0,
			profitAmount: data.profitAmount ?? 0,
			vatAmount: data.vatAmount ?? 0,
			totalAmount: data.totalAmount,
			validUntil: data.validUntil,
			paymentTerms: data.paymentTerms,
			deliveryTerms: data.deliveryTerms,
			showUnitPrices: data.showUnitPrices ?? true,
			showQuantities: data.showQuantities ?? true,
			showItemDescriptions: data.showItemDescriptions ?? true,
			includeTerms: data.includeTerms ?? true,
			includeCoverPage: data.includeCoverPage ?? true,
			selectedCategories: data.selectedCategories as object,
			termsAndConditions: data.termsAndConditions,
			notes: data.notes,
		},
	});
}

export async function getQuoteById(id: string) {
	return db.quote.findUnique({
		where: { id },
		include: {
			costStudy: {
				include: {
					organization: true,
					structuralItems: true,
					finishingItems: true,
					mepItems: true,
					laborItems: true,
				},
			},
		},
	});
}

export async function updateQuote(
	id: string,
	data: Partial<{
		quoteType: string;
		clientName: string;
		clientCompany: string;
		clientPhone: string;
		clientEmail: string;
		clientAddress: string;
		subtotal: number;
		overheadAmount: number;
		profitAmount: number;
		vatAmount: number;
		totalAmount: number;
		validUntil: Date;
		paymentTerms: string;
		deliveryTerms: string;
		showUnitPrices: boolean;
		showQuantities: boolean;
		showItemDescriptions: boolean;
		includeTerms: boolean;
		includeCoverPage: boolean;
		selectedCategories: unknown;
		termsAndConditions: string;
		notes: string;
		pdfUrl: string;
		status: string;
	}>,
) {
	return db.quote.update({
		where: { id },
		data: data as object,
	});
}

export async function deleteQuote(id: string) {
	return db.quote.delete({
		where: { id },
	});
}

export async function getQuotesByCostStudyId(costStudyId: string) {
	return db.quote.findMany({
		where: { costStudyId },
		orderBy: { createdAt: "desc" },
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Specification Template Queries - قوالب المواصفات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all spec templates for an organization (system + custom)
 */
export async function getSpecTemplates(organizationId: string) {
	return db.specificationTemplate.findMany({
		where: { organizationId },
		orderBy: [{ isSystem: "desc" }, { name: "asc" }],
	});
}

/**
 * Create a new custom spec template
 */
export async function createSpecTemplate(data: {
	name: string;
	nameEn?: string;
	description?: string;
	organizationId: string;
	createdById: string;
	specs: unknown;
}) {
	return db.specificationTemplate.create({
		data: {
			name: data.name,
			nameEn: data.nameEn,
			description: data.description,
			organizationId: data.organizationId,
			createdById: data.createdById,
			specs: data.specs as object,
			isSystem: false,
		},
	});
}

/**
 * Update a non-system spec template
 */
export async function updateSpecTemplate(
	id: string,
	organizationId: string,
	data: Partial<{
		name: string;
		nameEn: string;
		description: string;
		specs: unknown;
	}>,
) {
	const existing = await db.specificationTemplate.findFirst({
		where: { id, organizationId, isSystem: false },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Spec template not found or is a system template");
	}

	return db.specificationTemplate.update({
		where: { id },
		data: data as object,
	});
}

/**
 * Delete a non-system spec template
 */
export async function deleteSpecTemplate(id: string, organizationId: string) {
	const existing = await db.specificationTemplate.findFirst({
		where: { id, organizationId, isSystem: false },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Spec template not found or is a system template");
	}

	return db.specificationTemplate.delete({
		where: { id },
	});
}

/**
 * Set a spec template as the default for an organization
 */
export async function setDefaultSpecTemplate(id: string, organizationId: string) {
	const existing = await db.specificationTemplate.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Spec template not found");
	}

	await db.$transaction([
		// Unset previous default
		db.specificationTemplate.updateMany({
			where: { organizationId, isDefault: true },
			data: { isDefault: false },
		}),
		// Set new default
		db.specificationTemplate.update({
			where: { id },
			data: { isDefault: true },
		}),
	]);

	return db.specificationTemplate.findUnique({ where: { id } });
}

/**
 * Batch update specData on multiple finishing items
 */
export async function batchUpdateFinishingItemSpecs(
	costStudyId: string,
	items: Array<{
		id: string;
		specData: unknown;
		qualityLevel?: string;
		brand?: string;
		specifications?: string;
	}>,
) {
	if (items.length === 0) return;

	await db.$transaction(
		items.map((item) =>
			db.finishingItem.update({
				where: { id: item.id },
				data: {
					specData: item.specData as object,
					qualityLevel: item.qualityLevel,
					brand: item.brand,
					specifications: item.specifications,
				},
			}),
		),
	);
}

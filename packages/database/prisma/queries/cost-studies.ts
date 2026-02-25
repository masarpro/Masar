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
					area: item.area,
					unit: item.unit,
					wastagePercent: item.wastagePercent,
					qualityLevel: item.qualityLevel,
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
					itemType: item.itemType,
					name: item.name,
					description: item.description,
					quantity: item.quantity,
					unit: item.unit,
					unitPrice: item.unitPrice,
					totalCost: item.totalCost,
					sortOrder: item.sortOrder,
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
			where: { costStudyId: id },
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
	area: number;
	unit: string;
	wastagePercent?: number;
	qualityLevel?: string;
	materialPrice?: number;
	laborPrice?: number;
	materialCost?: number;
	laborCost?: number;
	totalCost?: number;
}) {
	const item = await db.finishingItem.create({
		data: {
			costStudyId: data.costStudyId,
			category: data.category,
			subCategory: data.subCategory,
			name: data.name,
			description: data.description,
			area: data.area,
			unit: data.unit,
			wastagePercent: data.wastagePercent ?? 8,
			qualityLevel: data.qualityLevel ?? "medium",
			materialPrice: data.materialPrice ?? 0,
			laborPrice: data.laborPrice ?? 0,
			materialCost: data.materialCost ?? 0,
			laborCost: data.laborCost ?? 0,
			totalCost: data.totalCost ?? 0,
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
		area: number;
		unit: string;
		wastagePercent?: number;
		qualityLevel?: string;
		materialPrice?: number;
		laborPrice?: number;
		materialCost?: number;
		laborCost?: number;
		totalCost?: number;
	}>,
) {
	await db.finishingItem.createMany({
		data: items.map((item) => ({
			costStudyId,
			category: item.category,
			subCategory: item.subCategory,
			name: item.name,
			description: item.description,
			area: item.area,
			unit: item.unit,
			wastagePercent: item.wastagePercent ?? 8,
			qualityLevel: item.qualityLevel ?? "medium",
			materialPrice: item.materialPrice ?? 0,
			laborPrice: item.laborPrice ?? 0,
			materialCost: item.materialCost ?? 0,
			laborCost: item.laborCost ?? 0,
			totalCost: item.totalCost ?? 0,
		})),
	});

	await recalculateCostStudyTotals(costStudyId);
}

export async function deleteFinishingItem(id: string, costStudyId: string) {
	await db.finishingItem.delete({
		where: { id },
	});

	await recalculateCostStudyTotals(costStudyId);
}

// ═══════════════════════════════════════════════════════════════════════════
// MEP Item Queries
// ═══════════════════════════════════════════════════════════════════════════

export async function createMEPItem(data: {
	costStudyId: string;
	category: string;
	itemType: string;
	name: string;
	description?: string;
	quantity: number;
	unit: string;
	unitPrice?: number;
	totalCost?: number;
}) {
	const item = await db.mEPItem.create({
		data: {
			costStudyId: data.costStudyId,
			category: data.category,
			itemType: data.itemType,
			name: data.name,
			description: data.description,
			quantity: data.quantity,
			unit: data.unit,
			unitPrice: data.unitPrice ?? 0,
			totalCost: data.totalCost ?? 0,
		},
	});

	await recalculateCostStudyTotals(data.costStudyId);

	return item;
}

export async function createMEPItemsBatch(
	costStudyId: string,
	items: Array<{
		category: string;
		itemType: string;
		name: string;
		description?: string;
		quantity: number;
		unit: string;
		unitPrice?: number;
		totalCost?: number;
	}>,
) {
	await db.mEPItem.createMany({
		data: items.map((item) => ({
			costStudyId,
			category: item.category,
			itemType: item.itemType,
			name: item.name,
			description: item.description,
			quantity: item.quantity,
			unit: item.unit,
			unitPrice: item.unitPrice ?? 0,
			totalCost: item.totalCost ?? 0,
		})),
	});

	await recalculateCostStudyTotals(costStudyId);
}

export async function deleteMEPItem(id: string, costStudyId: string) {
	await db.mEPItem.delete({
		where: { id },
	});

	await recalculateCostStudyTotals(costStudyId);
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

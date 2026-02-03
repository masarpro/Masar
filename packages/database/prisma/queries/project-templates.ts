import { db } from "../client";
import type { TemplateItemType } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Project Templates Queries - استعلامات قوالب المشاريع (Phase 7)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all templates for an organization
 */
export async function getOrganizationTemplates(
	organizationId: string,
	options?: {
		limit?: number;
		offset?: number;
		query?: string;
	},
) {
	const where: {
		organizationId: string;
		name?: { contains: string; mode: "insensitive" };
	} = { organizationId };

	if (options?.query) {
		where.name = { contains: options.query, mode: "insensitive" };
	}

	const [templates, total] = await Promise.all([
		db.projectTemplate.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
				sourceProject: { select: { id: true, name: true } },
				_count: { select: { items: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.projectTemplate.count({ where }),
	]);

	return { templates, total };
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(id: string, organizationId: string) {
	return db.projectTemplate.findFirst({
		where: { id, organizationId },
		include: {
			createdBy: { select: { id: true, name: true } },
			sourceProject: { select: { id: true, name: true } },
			items: {
				orderBy: { sortOrder: "asc" },
			},
		},
	});
}

/**
 * Create a template from scratch
 */
export async function createTemplate(data: {
	organizationId: string;
	createdById: string;
	name: string;
	description?: string;
	items?: Array<{
		type: TemplateItemType;
		title: string;
		description?: string;
		sortOrder?: number;
		metadata?: Record<string, unknown>;
	}>;
}) {
	return db.projectTemplate.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			name: data.name,
			description: data.description,
			items: data.items
				? {
						create: data.items.map((item, index) => ({
							type: item.type,
							title: item.title,
							description: item.description,
							sortOrder: item.sortOrder ?? index,
							metadata: item.metadata,
						})),
					}
				: undefined,
		},
		include: {
			createdBy: { select: { id: true, name: true } },
			items: { orderBy: { sortOrder: "asc" } },
		},
	});
}

/**
 * Create a template from an existing project
 */
export async function createTemplateFromProject(data: {
	organizationId: string;
	createdById: string;
	sourceProjectId: string;
	name: string;
	description?: string;
}) {
	// Verify project exists and belongs to organization
	const project = await db.project.findFirst({
		where: { id: data.sourceProjectId, organizationId: data.organizationId },
		include: {
			milestones: {
				orderBy: { sortOrder: "asc" },
			},
		},
	});

	if (!project) {
		throw new Error("Project not found");
	}

	// Create template with milestones as items
	return db.projectTemplate.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			sourceProjectId: data.sourceProjectId,
			name: data.name,
			description: data.description || `قالب مأخوذ من مشروع: ${project.name}`,
			items: {
				create: project.milestones.map((milestone, index) => ({
					type: "MILESTONE" as TemplateItemType,
					title: milestone.title,
					description: milestone.description,
					sortOrder: milestone.sortOrder ?? index,
					metadata: {
						originalMilestoneId: milestone.id,
					},
				})),
			},
		},
		include: {
			createdBy: { select: { id: true, name: true } },
			sourceProject: { select: { id: true, name: true } },
			items: { orderBy: { sortOrder: "asc" } },
		},
	});
}

/**
 * Apply a template to a project (create milestones)
 */
export async function applyTemplateToProject(data: {
	organizationId: string;
	templateId: string;
	projectId: string;
	options?: {
		/**
		 * If true, delete existing milestones before applying template
		 */
		replaceExisting?: boolean;
		/**
		 * Start date for the first milestone (will be used as plannedStart)
		 */
		startDate?: Date;
		/**
		 * Duration in days between milestones (default: 7)
		 */
		durationBetweenMilestones?: number;
		/**
		 * Specific items to include (by index). If not provided, all items are included
		 */
		selectedItems?: number[];
	};
}) {
	// Verify template exists
	const template = await db.projectTemplate.findFirst({
		where: { id: data.templateId, organizationId: data.organizationId },
		include: { items: { orderBy: { sortOrder: "asc" } } },
	});

	if (!template) {
		throw new Error("Template not found");
	}

	// Verify project exists
	const project = await db.project.findFirst({
		where: { id: data.projectId, organizationId: data.organizationId },
	});

	if (!project) {
		throw new Error("Project not found");
	}

	const options = data.options || {};
	const durationDays = options.durationBetweenMilestones ?? 7;

	// If replaceExisting is true, delete all existing milestones
	if (options.replaceExisting) {
		await db.projectMilestone.deleteMany({
			where: { projectId: data.projectId },
		});
	}

	// Get existing milestones count for sortOrder
	const existingCount = options.replaceExisting
		? 0
		: await db.projectMilestone.count({
				where: { projectId: data.projectId },
			});

	// Filter milestone items
	let milestoneItems = template.items.filter(
		(item) => item.type === "MILESTONE",
	);

	// If selectedItems is provided, filter by index
	if (options.selectedItems && options.selectedItems.length > 0) {
		milestoneItems = milestoneItems.filter((_, index) =>
			options.selectedItems!.includes(index),
		);
	}

	if (milestoneItems.length === 0) {
		return {
			milestonesCreated: 0,
			milestonesDeleted: options.replaceExisting ? existingCount : 0,
			projectId: data.projectId,
		};
	}

	// Calculate dates if startDate is provided
	const calculateDates = (index: number) => {
		if (!options.startDate) {
			return { plannedStart: null, plannedEnd: null };
		}

		const startDate = new Date(options.startDate);
		startDate.setDate(startDate.getDate() + index * durationDays);

		const endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + durationDays - 1);

		return {
			plannedStart: startDate,
			plannedEnd: endDate,
		};
	};

	const createdMilestones = await db.projectMilestone.createMany({
		data: milestoneItems.map((item, index) => {
			const dates = calculateDates(index);
			return {
				organizationId: data.organizationId,
				projectId: data.projectId,
				title: item.title,
				description: item.description,
				sortOrder: existingCount + index,
				isCompleted: false,
				plannedStart: dates.plannedStart,
				plannedEnd: dates.plannedEnd,
			};
		}),
	});

	return {
		milestonesCreated: createdMilestones.count,
		milestonesDeleted: options.replaceExisting ? existingCount : 0,
		projectId: data.projectId,
	};
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string, organizationId: string) {
	const existing = await db.projectTemplate.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Template not found");
	}

	return db.projectTemplate.delete({
		where: { id },
	});
}

/**
 * Update a template
 */
export async function updateTemplate(
	id: string,
	organizationId: string,
	data: {
		name?: string;
		description?: string;
	},
) {
	const existing = await db.projectTemplate.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Template not found");
	}

	return db.projectTemplate.update({
		where: { id },
		data,
		include: {
			createdBy: { select: { id: true, name: true } },
			items: { orderBy: { sortOrder: "asc" } },
		},
	});
}

/**
 * Add item to template
 */
export async function addTemplateItem(
	templateId: string,
	organizationId: string,
	item: {
		type: TemplateItemType;
		title: string;
		description?: string;
		sortOrder?: number;
		metadata?: Record<string, unknown>;
	},
) {
	// Verify template exists
	const template = await db.projectTemplate.findFirst({
		where: { id: templateId, organizationId },
	});

	if (!template) {
		throw new Error("Template not found");
	}

	// Get current max sortOrder
	const maxOrder = await db.projectTemplateItem.aggregate({
		where: { templateId },
		_max: { sortOrder: true },
	});

	return db.projectTemplateItem.create({
		data: {
			templateId,
			type: item.type,
			title: item.title,
			description: item.description,
			sortOrder: item.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
			metadata: item.metadata,
		},
	});
}

/**
 * Remove item from template
 */
export async function removeTemplateItem(
	itemId: string,
	templateId: string,
	organizationId: string,
) {
	// Verify template exists
	const template = await db.projectTemplate.findFirst({
		where: { id: templateId, organizationId },
	});

	if (!template) {
		throw new Error("Template not found");
	}

	return db.projectTemplateItem.delete({
		where: { id: itemId },
	});
}

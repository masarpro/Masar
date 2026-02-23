import { db } from "../client";
import type { ContractStatus, PaymentMethod, PaymentTermType, ProjectStatus, ProjectType } from "../generated/client";
import { generateContractNo } from "./project-contract";

// ═══════════════════════════════════════════════════════════════════════════
// Project Queries - استعلامات المشاريع
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all projects for an organization with pagination and filters
 */
export async function getOrganizationProjects(
	organizationId: string,
	options?: {
		status?: ProjectStatus;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		status?: ProjectStatus;
		OR?: Array<{
			name?: { contains: string; mode: "insensitive" };
			clientName?: { contains: string; mode: "insensitive" };
			location?: { contains: string; mode: "insensitive" };
		}>;
	} = { organizationId };

	if (options?.status) {
		where.status = options.status;
	}

	if (options?.query) {
		where.OR = [
			{ name: { contains: options.query, mode: "insensitive" } },
			{ clientName: { contains: options.query, mode: "insensitive" } },
			{ location: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [projects, total] = await Promise.all([
		db.project.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
				photos: {
					take: 1,
					orderBy: { createdAt: "desc" },
					select: { url: true },
				},
				_count: { select: { members: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.project.count({ where }),
	]);

	return { projects, total };
}

/**
 * Get a single project by ID
 */
export async function getProjectById(id: string, organizationId: string) {
	return db.project.findFirst({
		where: { id, organizationId },
		include: {
			createdBy: { select: { id: true, name: true, email: true } },
		},
	});
}

/**
 * Generate a unique project slug within an organization
 */
export async function generateUniqueProjectSlug(
	organizationId: string,
	name: string,
): Promise<string> {
	// Simple slug generation: lowercase, replace spaces with dashes, remove special chars
	const baseSlug = name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^\w\u0600-\u06FF-]/g, "") // Keep Arabic chars and alphanumeric
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	let slug = baseSlug || "project";

	// Check uniqueness and add suffix if needed
	for (let i = 0; i < 10; i++) {
		const existing = await db.project.findUnique({
			where: {
				organizationId_slug: { organizationId, slug },
			},
			select: { id: true },
		});

		if (!existing) {
			return slug;
		}

		// Add random suffix
		const suffix = Math.random().toString(36).substring(2, 7);
		slug = `${baseSlug}-${suffix}`;
	}

	// Fallback: use timestamp
	return `${baseSlug}-${Date.now()}`;
}

/**
 * Generate the next project number for an organization (PRJ-001, PRJ-002, ...)
 */
export async function generateProjectNo(organizationId: string): Promise<string> {
	const count = await db.project.count({ where: { organizationId } });
	const nextNum = count + 1;
	return `PRJ-${String(nextNum).padStart(3, "0")}`;
}

/**
 * Create a new project (optionally with contract data)
 */
export async function createProject(data: {
	organizationId: string;
	createdById: string;
	name: string;
	description?: string;
	type?: ProjectType;
	clientName?: string;
	location?: string;
	contractValue?: number;
	startDate?: Date;
	endDate?: Date;
	// Contract fields (optional)
	contractNo?: string | null;
	contractStatus?: ContractStatus;
	signedDate?: Date | null;
	retentionPercent?: number | null;
	retentionCap?: number | null;
	retentionReleaseDays?: number | null;
	contractNotes?: string | null;
	// New contract fields
	includesVat?: boolean;
	vatPercent?: number | null;
	paymentMethod?: PaymentMethod | null;
	performanceBondPercent?: number | null;
	performanceBondAmount?: number | null;
	insuranceRequired?: boolean;
	insuranceDetails?: string | null;
	scopeOfWork?: string | null;
	penaltyPercent?: number | null;
	penaltyCapPercent?: number | null;
	// Payment terms
	paymentTerms?: Array<{
		type: PaymentTermType;
		label?: string | null;
		percent?: number | null;
		amount?: number | null;
		sortOrder?: number;
	}>;
}) {
	const slug = await generateUniqueProjectSlug(data.organizationId, data.name);
	const projectNo = await generateProjectNo(data.organizationId);

	// Create the project first
	const project = await db.project.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			name: data.name,
			slug,
			projectNo,
			description: data.description,
			type: data.type,
			clientName: data.clientName,
			location: data.location,
			contractValue: data.contractValue,
			startDate: data.startDate,
			endDate: data.endDate,
			status: "ACTIVE",
			progress: 0,
		},
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});

	// If contractValue is provided, create a ProjectContract record
	if (data.contractValue != null) {
		try {
			const contractNo = data.contractNo || await generateContractNo(data.organizationId);

			const contract = await db.projectContract.create({
				data: {
					organizationId: data.organizationId,
					projectId: project.id,
					createdById: data.createdById,
					contractNo,
					status: data.contractStatus ?? "DRAFT",
					value: data.contractValue,
					currency: "SAR",
					signedDate: data.signedDate ?? null,
					startDate: data.startDate ?? null,
					endDate: data.endDate ?? null,
					retentionPercent: data.retentionPercent ?? null,
					retentionCap: data.retentionCap ?? null,
					retentionReleaseDays: data.retentionReleaseDays ?? null,
					notes: data.contractNotes ?? null,
					includesVat: data.includesVat ?? false,
					vatPercent: data.vatPercent ?? null,
					paymentMethod: data.paymentMethod ?? null,
					performanceBondPercent: data.performanceBondPercent ?? null,
					performanceBondAmount: data.performanceBondAmount ?? null,
					insuranceRequired: data.insuranceRequired ?? false,
					insuranceDetails: data.insuranceDetails ?? null,
					scopeOfWork: data.scopeOfWork ?? null,
					penaltyPercent: data.penaltyPercent ?? null,
					penaltyCapPercent: data.penaltyCapPercent ?? null,
				},
			});

			// Create payment terms if provided
			if (data.paymentTerms && data.paymentTerms.length > 0) {
				await db.contractPaymentTerm.createMany({
					data: data.paymentTerms.map((term, index) => ({
						contractId: contract.id,
						type: term.type,
						label: term.label ?? null,
						percent: term.percent ?? null,
						amount: term.amount ?? null,
						sortOrder: term.sortOrder ?? index,
					})),
				});
			}
		} catch (err) {
			console.error("[createProject] Failed to create contract:", err);
		}
	}

	return project;
}

/**
 * Update a project
 */
export async function updateProject(
	id: string,
	organizationId: string,
	data: Partial<{
		name: string;
		description: string;
		status: ProjectStatus;
		type: ProjectType;
		clientName: string;
		location: string;
		contractValue: number;
		progress: number;
		startDate: Date;
		endDate: Date;
	}>,
) {
	// Verify ownership first
	const existing = await db.project.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Project not found");
	}

	return db.project.update({
		where: { id },
		data,
	});
}

/**
 * Delete a project
 */
export async function deleteProject(id: string, organizationId: string) {
	const existing = await db.project.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Project not found");
	}

	return db.project.delete({
		where: { id },
	});
}

/**
 * Get project statistics for an organization
 */
export async function getProjectStats(organizationId: string) {
	const [statusGroups, totalValue] = await Promise.all([
		db.project.groupBy({
			by: ["status"],
			where: { organizationId },
			_count: { id: true },
		}),
		db.project.aggregate({
			where: { organizationId },
			_sum: { contractValue: true },
		}),
	]);

	const countByStatus = (status: string) =>
		statusGroups.find((g) => g.status === status)?._count.id ?? 0;

	const total = statusGroups.reduce((sum, g) => sum + g._count.id, 0);

	return {
		total,
		active: countByStatus("ACTIVE"),
		onHold: countByStatus("ON_HOLD"),
		completed: countByStatus("COMPLETED"),
		totalValue: totalValue._sum.contractValue
			? Number(totalValue._sum.contractValue)
			: 0,
	};
}

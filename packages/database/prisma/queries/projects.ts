import { db } from "../client";
import type { ProjectStatus, ProjectType } from "../generated/client";

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
 * Create a new project
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
}) {
	const slug = await generateUniqueProjectSlug(data.organizationId, data.name);

	return db.project.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			name: data.name,
			slug,
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
	const [total, active, onHold, completed, totalValue] = await Promise.all([
		db.project.count({ where: { organizationId } }),
		db.project.count({ where: { organizationId, status: "ACTIVE" } }),
		db.project.count({ where: { organizationId, status: "ON_HOLD" } }),
		db.project.count({ where: { organizationId, status: "COMPLETED" } }),
		db.project.aggregate({
			where: { organizationId },
			_sum: { contractValue: true },
		}),
	]);

	return {
		total,
		active,
		onHold,
		completed,
		totalValue: totalValue._sum.contractValue
			? Number(totalValue._sum.contractValue)
			: 0,
	};
}

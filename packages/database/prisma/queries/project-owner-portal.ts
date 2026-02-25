import { db } from "../client";
import { randomBytes } from "crypto";

// ═══════════════════════════════════════════════════════════════════════════
// Owner Access Queries - وصول مالك المشروع
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a secure random token
 */
function generateToken(): string {
	return randomBytes(32).toString("hex");
}

/**
 * Create owner access token
 */
export async function createOwnerAccess(
	organizationId: string,
	projectId: string,
	data: {
		createdById: string;
		label?: string;
		expiresInDays?: number;
	},
) {
	const token = generateToken();
	const expiresInDays = data.expiresInDays ?? 90;
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + expiresInDays);

	return db.projectOwnerAccess.create({
		data: {
			organizationId,
			projectId,
			token,
			label: data.label ?? "مالك المشروع",
			expiresAt,
			createdById: data.createdById,
		},
		include: {
			project: { select: { name: true, slug: true } },
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * List active owner access tokens for a project
 */
export async function listOwnerAccesses(
	organizationId: string,
	projectId: string,
) {
	return db.projectOwnerAccess.findMany({
		where: {
			organizationId,
			projectId,
			isRevoked: false,
		},
		include: {
			createdBy: { select: { id: true, name: true } },
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Revoke an owner access token
 */
export async function revokeOwnerAccess(
	organizationId: string,
	projectId: string,
	accessId: string,
) {
	return db.projectOwnerAccess.update({
		where: {
			id: accessId,
			organizationId,
			projectId,
		},
		data: {
			isRevoked: true,
		},
	});
}

/**
 * Get owner context by token (validates token and returns project info)
 */
export async function getOwnerContextByToken(token: string) {
	const access = await db.projectOwnerAccess.findUnique({
		where: { token },
		include: {
			project: {
				select: {
					id: true,
					name: true,
					slug: true,
					status: true,
					clientName: true,
					location: true,
					progress: true,
					contractValue: true,
					startDate: true,
					endDate: true,
					organizationId: true,
					organization: {
						select: { name: true, logo: true },
					},
				},
			},
		},
	});

	if (!access) {
		return null;
	}

	// Check if revoked
	if (access.isRevoked) {
		return null;
	}

	// Check if expired
	if (access.expiresAt && access.expiresAt < new Date()) {
		return null;
	}

	return {
		accessId: access.id,
		organizationId: access.organizationId,
		projectId: access.projectId,
		project: access.project,
		label: access.label,
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// Owner Portal Data Queries - بيانات بوابة المالك
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get owner summary (for portal home page)
 */
export async function getOwnerSummary(organizationId: string, projectId: string) {
	const [project, latestProgressUpdate, latestOfficialUpdate, upcomingClaim] = await Promise.all([
		db.project.findFirst({
			where: { id: projectId, organizationId },
			select: {
				id: true,
				name: true,
				status: true,
				progress: true,
				clientName: true,
				location: true,
				contractValue: true,
				startDate: true,
				endDate: true,
			},
		}),
		db.projectProgressUpdate.findFirst({
			where: { projectId },
			orderBy: { createdAt: "desc" },
			select: {
				progress: true,
				phaseLabel: true,
				note: true,
				createdAt: true,
			},
		}),
		db.projectMessage.findFirst({
			where: {
				organizationId,
				projectId,
				channel: "OWNER",
				isUpdate: true,
			},
			orderBy: { createdAt: "desc" },
			select: {
				content: true,
				createdAt: true,
				sender: { select: { name: true } },
			},
		}),
		db.projectClaim.findFirst({
			where: {
				organizationId,
				projectId,
				status: { in: ["SUBMITTED", "APPROVED"] },
				dueDate: { gte: new Date() },
			},
			orderBy: { dueDate: "asc" },
			select: {
				claimNo: true,
				amount: true,
				dueDate: true,
				status: true,
			},
		}),
	]);

	return {
		project,
		currentPhase: latestProgressUpdate?.phaseLabel ?? null,
		latestOfficialUpdate,
		upcomingPayment: upcomingClaim,
	};
}

/**
 * Get owner schedule (milestones)
 */
export async function getOwnerSchedule(organizationId: string, projectId: string) {
	const milestones = await db.projectMilestone.findMany({
		where: { organizationId, projectId },
		orderBy: { sortOrder: "asc" },
		select: {
			id: true,
			title: true,
			description: true,
			plannedDate: true,
			actualDate: true,
			isCompleted: true,
			sortOrder: true,
		},
	});

	// If no milestones exist, generate default ones from project dates
	if (milestones.length === 0) {
		const project = await db.project.findFirst({
			where: { id: projectId, organizationId },
			select: { startDate: true, endDate: true },
		});

		// Return default phases based on project dates
		const defaultPhases = [
			{ title: "بداية المشروع", sortOrder: 1 },
			{ title: "الأساسات", sortOrder: 2 },
			{ title: "الهيكل الخرساني", sortOrder: 3 },
			{ title: "التشطيبات", sortOrder: 4 },
			{ title: "التسليم", sortOrder: 5 },
		];

		return defaultPhases.map((phase, index) => ({
			id: `default-${index}`,
			...phase,
			description: null,
			plannedDate: project?.startDate ?? null,
			actualDate: null,
			isCompleted: false,
		}));
	}

	return milestones;
}

/**
 * Get owner payments (claims summary - no expenses)
 */
export async function getOwnerPayments(organizationId: string, projectId: string) {
	const [project, claims, claimStats] = await Promise.all([
		db.project.findFirst({
			where: { id: projectId, organizationId },
			select: { contractValue: true },
		}),
		db.projectClaim.findMany({
			where: {
				organizationId,
				projectId,
				status: { in: ["SUBMITTED", "APPROVED", "PAID"] },
			},
			orderBy: { dueDate: "asc" },
			select: {
				id: true,
				claimNo: true,
				amount: true,
				dueDate: true,
				status: true,
				periodStart: true,
				periodEnd: true,
			},
		}),
		db.projectClaim.aggregate({
			where: { organizationId, projectId },
			_sum: {
				amount: true,
			},
		}),
	]);

	const paidClaims = await db.projectClaim.aggregate({
		where: { organizationId, projectId, status: "PAID" },
		_sum: { amount: true },
	});

	const contractValue = project?.contractValue ? Number(project.contractValue) : 0;
	const totalClaims = claimStats._sum.amount ? Number(claimStats._sum.amount) : 0;
	const paidAmount = paidClaims._sum.amount ? Number(paidClaims._sum.amount) : 0;
	const remaining = contractValue - paidAmount;

	// Filter upcoming payments
	const upcomingPayments = claims.filter(
		(c) => c.status !== "PAID" && c.dueDate && new Date(c.dueDate) >= new Date()
	);

	return {
		contractValue,
		totalClaims,
		paidAmount,
		remaining,
		claims: claims.map((c) => ({
			...c,
			amount: Number(c.amount),
		})),
		upcomingPayments: upcomingPayments.map((c) => ({
			...c,
			amount: Number(c.amount),
		})),
	};
}

/**
 * Get owner messages (OWNER channel only)
 */
export async function getOwnerMessages(
	organizationId: string,
	projectId: string,
	options?: {
		page?: number;
		pageSize?: number;
	},
) {
	const page = options?.page ?? 1;
	const pageSize = options?.pageSize ?? 50;
	const skip = (page - 1) * pageSize;

	const [messages, total] = await Promise.all([
		db.projectMessage.findMany({
			where: {
				organizationId,
				projectId,
				channel: "OWNER",
			},
			include: {
				sender: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: pageSize,
		}),
		db.projectMessage.count({
			where: {
				organizationId,
				projectId,
				channel: "OWNER",
			},
		}),
	]);

	return {
		items: messages.reverse(),
		total,
		page,
		pageSize,
	};
}

/**
 * Send owner message (from portal - marks sender as OWNER type)
 */
export async function sendOwnerPortalMessage(
	organizationId: string,
	projectId: string,
	data: {
		content: string;
		senderName: string; // Name from portal visitor
	},
) {
	// For portal messages, we don't have a real user ID
	// We'll use the project creator or first admin as proxy sender
	// In a real system, you might create a special "portal" user
	const project = await db.project.findFirst({
		where: { id: projectId, organizationId },
		select: { createdById: true },
	});

	if (!project) {
		throw new Error("Project not found");
	}

	// Create message with metadata indicating it's from portal
	return db.projectMessage.create({
		data: {
			organizationId,
			projectId,
			channel: "OWNER",
			senderId: project.createdById, // Use project creator as proxy
			content: `[من المالك] ${data.content}`,
			isUpdate: false,
		},
		include: {
			sender: { select: { id: true, name: true, image: true } },
		},
	});
}

/**
 * Get official updates only (for owner portal)
 */
export async function getOwnerPortalOfficialUpdates(
	organizationId: string,
	projectId: string,
	options?: { limit?: number },
) {
	return db.projectMessage.findMany({
		where: {
			organizationId,
			projectId,
			channel: "OWNER",
			isUpdate: true,
		},
		include: {
			sender: { select: { id: true, name: true, image: true } },
		},
		orderBy: { createdAt: "desc" },
		take: options?.limit ?? 10,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Milestone Management - إدارة المراحل
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a milestone (legacy owner-portal version using sortOrder/plannedDate)
 */
export async function ownerCreateMilestone(
	organizationId: string,
	projectId: string,
	data: {
		title: string;
		description?: string;
		plannedDate?: Date;
		sortOrder?: number;
	},
) {
	// Get max sort order
	const maxOrder = await db.projectMilestone.aggregate({
		where: { organizationId, projectId },
		_max: { sortOrder: true },
	});

	return db.projectMilestone.create({
		data: {
			organizationId,
			projectId,
			title: data.title,
			description: data.description,
			plannedDate: data.plannedDate,
			sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
		},
	});
}

/**
 * Update a milestone (legacy owner-portal version)
 */
export async function ownerUpdateMilestone(
	organizationId: string,
	projectId: string,
	milestoneId: string,
	data: {
		title?: string;
		description?: string;
		plannedDate?: Date | null;
		actualDate?: Date | null;
		isCompleted?: boolean;
		sortOrder?: number;
	},
) {
	return db.projectMilestone.update({
		where: {
			id: milestoneId,
			organizationId,
			projectId,
		},
		data,
	});
}

/**
 * Delete a milestone (legacy owner-portal version)
 */
export async function ownerDeleteMilestone(
	organizationId: string,
	projectId: string,
	milestoneId: string,
) {
	return db.projectMilestone.delete({
		where: {
			id: milestoneId,
			organizationId,
			projectId,
		},
	});
}

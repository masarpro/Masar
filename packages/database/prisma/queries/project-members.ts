import { db } from "../client";
import type { ProjectRole } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Project Members Queries - استعلامات فريق المشروع
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all members of a project
 */
export async function getProjectMembers(
	projectId: string,
	organizationId: string,
) {
	// Verify project belongs to organization
	const project = await db.project.findFirst({
		where: { id: projectId, organizationId },
		select: { id: true },
	});

	if (!project) {
		throw new Error("المشروع غير موجود");
	}

	return db.projectMember.findMany({
		where: { projectId },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
				},
			},
			assignedBy: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: { assignedAt: "asc" },
	});
}

/**
 * Add a member to a project
 */
export async function addProjectMember(data: {
	projectId: string;
	organizationId: string;
	userId: string;
	role: ProjectRole;
	assignedById: string;
}) {
	// Verify project belongs to organization
	const project = await db.project.findFirst({
		where: { id: data.projectId, organizationId: data.organizationId },
		select: { id: true },
	});

	if (!project) {
		throw new Error("المشروع غير موجود");
	}

	// Verify user belongs to organization
	const user = await db.user.findFirst({
		where: { id: data.userId, organizationId: data.organizationId },
		select: { id: true },
	});

	if (!user) {
		throw new Error("المستخدم غير موجود في المنظمة");
	}

	// Check if already a member
	const existing = await db.projectMember.findUnique({
		where: {
			projectId_userId: {
				projectId: data.projectId,
				userId: data.userId,
			},
		},
	});

	if (existing) {
		throw new Error("المستخدم عضو بالفعل في المشروع");
	}

	return db.projectMember.create({
		data: {
			projectId: data.projectId,
			userId: data.userId,
			role: data.role,
			assignedById: data.assignedById,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
				},
			},
			assignedBy: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});
}

/**
 * Update a project member's role
 */
export async function updateProjectMemberRole(
	projectId: string,
	userId: string,
	newRole: ProjectRole,
) {
	const existing = await db.projectMember.findUnique({
		where: {
			projectId_userId: {
				projectId,
				userId,
			},
		},
	});

	if (!existing) {
		throw new Error("العضو غير موجود في المشروع");
	}

	return db.projectMember.update({
		where: {
			projectId_userId: {
				projectId,
				userId,
			},
		},
		data: { role: newRole },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
				},
			},
			assignedBy: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(projectId: string, userId: string) {
	const existing = await db.projectMember.findUnique({
		where: {
			projectId_userId: {
				projectId,
				userId,
			},
		},
	});

	if (!existing) {
		throw new Error("العضو غير موجود في المشروع");
	}

	return db.projectMember.delete({
		where: {
			projectId_userId: {
				projectId,
				userId,
			},
		},
	});
}

/**
 * Check if a user is a member of a project
 */
export async function isProjectMember(projectId: string, userId: string) {
	const membership = await db.projectMember.findUnique({
		where: {
			projectId_userId: {
				projectId,
				userId,
			},
		},
	});

	return !!membership;
}

/**
 * Get a user's role in a project
 */
export async function getProjectMemberRole(projectId: string, userId: string) {
	const membership = await db.projectMember.findUnique({
		where: {
			projectId_userId: {
				projectId,
				userId,
			},
		},
		select: { role: true },
	});

	return membership?.role ?? null;
}

/**
 * Get all projects a user is a member of
 */
export async function getProjectsForUser(
	userId: string,
	organizationId: string,
) {
	const memberships = await db.projectMember.findMany({
		where: {
			userId,
			project: { organizationId },
		},
		include: {
			project: {
				select: {
					id: true,
					name: true,
					slug: true,
					status: true,
					progress: true,
				},
			},
		},
		orderBy: { assignedAt: "desc" },
	});

	return memberships.map((m) => ({
		...m.project,
		role: m.role,
		assignedAt: m.assignedAt,
	}));
}

/**
 * Get project member count
 */
export async function getProjectMemberCount(projectId: string) {
	return db.projectMember.count({
		where: { projectId },
	});
}

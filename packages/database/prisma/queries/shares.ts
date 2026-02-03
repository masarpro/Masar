import { db } from "../client";
import type { ShareResourceType } from "../generated/client";
import { createId } from "@paralleldrive/cuid2";

// ═══════════════════════════════════════════════════════════════════════════
// Share Links Queries (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a secure random token
 */
function generateShareToken(): string {
	// Generate a cuid2 for the token (secure and URL-safe)
	return createId();
}

/**
 * Create a share link
 */
export async function createShareLink(data: {
	organizationId: string;
	projectId: string;
	resourceType: ShareResourceType;
	resourceId?: string;
	createdById: string;
	expiresInDays?: number;
}) {
	const token = generateShareToken();
	const expiresAt = data.expiresInDays
		? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
		: null;

	return db.shareLink.create({
		data: {
			token,
			organizationId: data.organizationId,
			projectId: data.projectId,
			resourceType: data.resourceType,
			resourceId: data.resourceId,
			createdById: data.createdById,
			expiresAt,
		},
		include: {
			project: { select: { id: true, name: true } },
			createdBy: { select: { id: true, name: true } },
		},
	});
}

/**
 * Get share link by token (validates not revoked and not expired)
 */
export async function getShareLinkByToken(token: string) {
	const shareLink = await db.shareLink.findUnique({
		where: { token },
		include: {
			project: {
				select: {
					id: true,
					name: true,
					clientName: true,
					organizationId: true,
				},
			},
		},
	});

	if (!shareLink) {
		return null;
	}

	// Check if revoked
	if (shareLink.isRevoked) {
		return null;
	}

	// Check if expired
	if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
		return null;
	}

	return shareLink;
}

/**
 * Revoke a share link
 */
export async function revokeShareLink(
	token: string,
	organizationId: string,
	projectId: string,
) {
	const existing = await db.shareLink.findFirst({
		where: { token, organizationId, projectId },
	});

	if (!existing) {
		throw new Error("Share link not found");
	}

	return db.shareLink.update({
		where: { token },
		data: { isRevoked: true },
	});
}

/**
 * List share links for a project
 */
export async function listProjectShareLinks(
	organizationId: string,
	projectId: string,
	options?: {
		resourceType?: ShareResourceType;
		includeRevoked?: boolean;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		projectId: string;
		resourceType?: ShareResourceType;
		isRevoked?: boolean;
	} = { organizationId, projectId };

	if (options?.resourceType) {
		where.resourceType = options.resourceType;
	}

	if (!options?.includeRevoked) {
		where.isRevoked = false;
	}

	const [links, total] = await Promise.all([
		db.shareLink.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.shareLink.count({ where }),
	]);

	return { links, total };
}

/**
 * Get resource data for a share link (based on resource type)
 */
export async function getSharedResourceData(
	shareLink: {
		organizationId: string;
		projectId: string;
		resourceType: ShareResourceType;
		resourceId: string | null;
	},
) {
	switch (shareLink.resourceType) {
		case "DOCUMENT":
			if (!shareLink.resourceId) return null;
			return db.projectDocument.findFirst({
				where: {
					id: shareLink.resourceId,
					projectId: shareLink.projectId,
				},
			});

		case "CLAIM_PDF":
			if (!shareLink.resourceId) return null;
			return db.projectClaim.findFirst({
				where: {
					id: shareLink.resourceId,
					projectId: shareLink.projectId,
				},
				include: {
					project: { select: { id: true, name: true, clientName: true } },
				},
			});

		case "UPDATE_PDF":
			if (!shareLink.resourceId) return null;
			return db.projectMessage.findFirst({
				where: {
					id: shareLink.resourceId,
					projectId: shareLink.projectId,
					isUpdate: true,
				},
				include: {
					project: { select: { id: true, name: true, clientName: true } },
				},
			});

		case "ICS":
			// ICS doesn't need a specific resource, it uses the whole project
			return db.project.findFirst({
				where: {
					id: shareLink.projectId,
					organizationId: shareLink.organizationId,
				},
				include: {
					milestones: { orderBy: { sortOrder: "asc" } },
					claims: {
						where: {
							status: { in: ["APPROVED", "SUBMITTED"] },
							dueDate: { not: null },
						},
						orderBy: { dueDate: "asc" },
					},
				},
			});

		case "WEEKLY_REPORT":
			// Weekly report uses project data
			return db.project.findFirst({
				where: {
					id: shareLink.projectId,
					organizationId: shareLink.organizationId,
				},
			});

		case "PHOTO_ALBUM":
			// Return recent photos from project
			return db.projectPhoto.findMany({
				where: { projectId: shareLink.projectId },
				orderBy: { createdAt: "desc" },
				take: 50,
			});

		default:
			return null;
	}
}

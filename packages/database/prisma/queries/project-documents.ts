import { db } from "../client";

// Type definitions for document enums
type DocumentFolder = "CONTRACT" | "DRAWINGS" | "CLAIMS" | "LETTERS" | "PHOTOS" | "OTHER";
type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
type ApproverStatus = "PENDING" | "APPROVED" | "REJECTED";

// ═══════════════════════════════════════════════════════════════════════════
// Document Queries - الوثائق
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List documents for a project
 */
export async function listDocuments(
	organizationId: string,
	projectId: string,
	options?: {
		folder?: DocumentFolder;
		search?: string;
		page?: number;
		pageSize?: number;
	},
) {
	const page = options?.page ?? 1;
	const pageSize = options?.pageSize ?? 20;
	const skip = (page - 1) * pageSize;

	const where: {
		organizationId: string;
		projectId: string;
		folder?: DocumentFolder;
		title?: { contains: string; mode: "insensitive" };
	} = { organizationId, projectId };

	if (options?.folder) {
		where.folder = options.folder;
	}

	if (options?.search) {
		where.title = { contains: options.search, mode: "insensitive" };
	}

	const [documents, total] = await Promise.all([
		db.projectDocument.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
				approvals: {
					orderBy: { createdAt: "desc" },
					take: 1,
					select: { id: true, status: true },
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: pageSize,
		}),
		db.projectDocument.count({ where }),
	]);

	return {
		items: documents,
		total,
		page,
		pageSize,
		totalPages: Math.ceil(total / pageSize),
	};
}

/**
 * Get a document by ID
 */
export async function getDocument(
	organizationId: string,
	projectId: string,
	documentId: string,
) {
	return db.projectDocument.findFirst({
		where: { id: documentId, organizationId, projectId },
		include: {
			createdBy: { select: { id: true, name: true, image: true } },
			approvals: {
				include: {
					requestedBy: { select: { id: true, name: true, image: true } },
					approvers: {
						include: {
							user: { select: { id: true, name: true, image: true } },
						},
					},
				},
				orderBy: { createdAt: "desc" },
			},
		},
	});
}

/**
 * Create a new document
 */
export async function createDocument(
	organizationId: string,
	projectId: string,
	data: {
		folder: DocumentFolder;
		title: string;
		description?: string;
		fileUrl: string;
		createdById: string;
	},
) {
	return db.projectDocument.create({
		data: {
			organizationId,
			projectId,
			folder: data.folder,
			title: data.title,
			description: data.description,
			fileUrl: data.fileUrl,
			createdById: data.createdById,
		},
		include: {
			createdBy: { select: { id: true, name: true, image: true } },
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Approval Queries - الاعتمادات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create an approval request for a document
 */
export async function createApprovalRequest(
	organizationId: string,
	projectId: string,
	data: {
		documentId: string;
		requestedById: string;
		approverUserIds: string[];
		note?: string;
	},
) {
	return db.projectApproval.create({
		data: {
			organizationId,
			projectId,
			documentId: data.documentId,
			requestedById: data.requestedById,
			note: data.note,
			approvers: {
				create: data.approverUserIds.map((userId) => ({
					userId,
				})),
			},
		},
		include: {
			requestedBy: { select: { id: true, name: true, image: true } },
			document: { select: { id: true, title: true, folder: true } },
			approvers: {
				include: {
					user: { select: { id: true, name: true, image: true } },
				},
			},
		},
	});
}

/**
 * Get an approval by ID
 */
export async function getApproval(
	organizationId: string,
	projectId: string,
	approvalId: string,
) {
	return db.projectApproval.findFirst({
		where: { id: approvalId, organizationId, projectId },
		include: {
			requestedBy: { select: { id: true, name: true, image: true } },
			document: {
				select: {
					id: true,
					title: true,
					folder: true,
					fileUrl: true,
					createdBy: { select: { id: true, name: true } },
				},
			},
			approvers: {
				include: {
					user: { select: { id: true, name: true, image: true } },
				},
			},
		},
	});
}

/**
 * Act on an approval (approve/reject)
 */
export async function actOnApproval(
	organizationId: string,
	projectId: string,
	approvalId: string,
	data: {
		actorId: string;
		decision: "APPROVED" | "REJECTED";
		note?: string;
	},
) {
	// Update the approver's status
	await db.projectApprovalApprover.updateMany({
		where: {
			approvalId,
			userId: data.actorId,
		},
		data: {
			status: data.decision,
			decidedAt: new Date(),
			note: data.note,
		},
	});

	// Get all approvers to check if approval should be finalized
	const approvers = await db.projectApprovalApprover.findMany({
		where: { approvalId },
	});

	// Determine overall approval status
	let overallStatus: ApprovalStatus = "PENDING";
	const hasRejection = approvers.some((a) => a.status === "REJECTED");
	const allApproved = approvers.every((a) => a.status === "APPROVED");

	if (hasRejection) {
		overallStatus = "REJECTED";
	} else if (allApproved) {
		overallStatus = "APPROVED";
	}

	// Update approval if finalized
	if (overallStatus !== "PENDING") {
		await db.projectApproval.update({
			where: { id: approvalId },
			data: {
				status: overallStatus,
				decidedAt: new Date(),
				decisionNote: data.note,
			},
		});
	}

	return getApproval(organizationId, projectId, approvalId);
}

/**
 * List pending approvals for a user
 */
export async function listPendingApprovalsForUser(
	organizationId: string,
	userId: string,
) {
	return db.projectApprovalApprover.findMany({
		where: {
			userId,
			status: "PENDING",
			approval: {
				organizationId,
				status: "PENDING",
			},
		},
		include: {
			approval: {
				include: {
					document: {
						select: {
							id: true,
							title: true,
							folder: true,
							projectId: true,
							project: { select: { name: true, slug: true } },
						},
					},
					requestedBy: { select: { id: true, name: true, image: true } },
				},
			},
		},
		orderBy: { approval: { requestedAt: "desc" } },
	});
}

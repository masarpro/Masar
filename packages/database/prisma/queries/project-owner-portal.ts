import { db } from "../client";
import { randomBytes, randomUUID } from "crypto";

/** Round to 2 decimals (financial amounts are Decimal(15,2)). */
function round2(value: number): number {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

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

export type OwnerTokenFailReason = "NOT_FOUND" | "REVOKED" | "EXPIRED";

export type OwnerContextResult =
	| {
			ok: true;
			accessId: string;
			organizationId: string;
			projectId: string;
			project: {
				id: string;
				name: string;
				slug: string;
				status: string;
				clientName: string | null;
				location: string | null;
				progress: unknown;
				contractValue: unknown;
				startDate: Date | null;
				endDate: Date | null;
				organizationId: string;
				organization: { name: string; logo: string | null };
			};
			label: string | null;
	  }
	| { ok: false; reason: OwnerTokenFailReason };

/**
 * Get owner context by token (validates token and returns project info)
 *
 * Returns a discriminated result so callers can show different error
 * messages for expired vs invalid/revoked tokens.
 */
export async function getOwnerContextByToken(
	token: string,
): Promise<OwnerContextResult> {
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
		return { ok: false, reason: "NOT_FOUND" };
	}

	// Check if revoked
	if (access.isRevoked) {
		return { ok: false, reason: "REVOKED" };
	}

	// Check if expired — null expiresAt is treated as expired for security
	if (!access.expiresAt || access.expiresAt < new Date()) {
		return { ok: false, reason: "EXPIRED" };
	}

	return {
		ok: true,
		accessId: access.id,
		organizationId: access.organizationId,
		projectId: access.projectId,
		project: access.project,
		label: access.label,
	};
}

/**
 * @deprecated Use getOwnerContextByToken which returns discriminated result.
 * This wrapper preserves the old null-return behavior for callers not yet migrated.
 */
export async function getOwnerContextByTokenLegacy(token: string) {
	const result = await getOwnerContextByToken(token);
	if (!result.ok) return null;
	const { ok, ...context } = result;
	return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// Owner Portal Session Management
// ═══════════════════════════════════════════════════════════════════════════

/** Maximum absolute session lifetime — 8 hours regardless of sliding refresh */
const MAX_SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;

/**
 * Create a session for an owner portal access token.
 * Session is valid for 1 hour and can be refreshed.
 */
export async function createOwnerPortalSession(
	portalAccessId: string,
	opts?: { ipAddress?: string; userAgent?: string },
) {
	const sessionToken = randomUUID();
	const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

	return db.ownerPortalSession.create({
		data: {
			sessionToken,
			portalAccessId,
			expiresAt,
			ipAddress: opts?.ipAddress ?? null,
			userAgent: opts?.userAgent ?? null,
		},
	});
}

/**
 * Validate an owner portal session and return the context.
 * Also refreshes lastAccessedAt and extends expiry on valid sessions.
 */
export async function getOwnerContextBySession(
	sessionToken: string,
): Promise<OwnerContextResult> {
	const session = await db.ownerPortalSession.findUnique({
		where: { sessionToken },
		include: {
			portalAccess: {
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
			},
		},
	});

	if (!session) {
		return { ok: false, reason: "NOT_FOUND" };
	}

	// Check session expiry
	if (session.expiresAt < new Date()) {
		return { ok: false, reason: "EXPIRED" };
	}

	// Check absolute session lifetime (8 hours max regardless of refresh)
	if (Date.now() - session.createdAt.getTime() > MAX_SESSION_LIFETIME_MS) {
		return { ok: false, reason: "EXPIRED" };
	}

	const access = session.portalAccess;

	// Check if underlying access is revoked
	if (access.isRevoked) {
		return { ok: false, reason: "REVOKED" };
	}

	// Check if underlying access has expired
	if (!access.expiresAt || access.expiresAt < new Date()) {
		return { ok: false, reason: "EXPIRED" };
	}

	// Refresh session: extend expiry by 1 hour, but never past 8h absolute max
	const maxExpiresAt = new Date(session.createdAt.getTime() + MAX_SESSION_LIFETIME_MS);
	const newExpiresAt = new Date(Math.min(Date.now() + 60 * 60 * 1000, maxExpiresAt.getTime()));

	await db.ownerPortalSession.update({
		where: { id: session.id },
		data: {
			lastAccessedAt: new Date(),
			expiresAt: newExpiresAt,
		},
	});

	return {
		ok: true,
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
 * Compute the total contract value as the owner should see it:
 * base contract value + approved/implemented change orders + VAT.
 *
 * Source of truth is the ProjectContract record (which carries VAT flags).
 * When no contract exists, falls back to Project.contractValue (no VAT info).
 *
 * VAT rule (the stored contract value is NET / pre-VAT):
 *  - includesVat === true  → contract is subject to VAT → add VAT at vatPercent
 *                            (defaults to 15%) on the base value only
 *  - includesVat === false → not subject to VAT → no VAT added
 *
 * Change order cost impacts are already VAT-inclusive, so they are added on top
 * of the VAT-inclusive contract value and never taxed again.
 */
async function computeContractTotal(
	organizationId: string,
	projectId: string,
): Promise<{ base: number; vatAmount: number; total: number }> {
	const [contract, coAgg, project] = await Promise.all([
		db.projectContract.findFirst({
			where: { organizationId, projectId },
			select: { value: true, includesVat: true, vatPercent: true },
		}),
		db.projectChangeOrder.aggregate({
			where: {
				organizationId,
				projectId,
				status: { in: ["APPROVED", "IMPLEMENTED"] },
				costImpact: { not: null },
			},
			_sum: { costImpact: true },
		}),
		db.project.findFirst({
			where: { id: projectId, organizationId },
			select: { contractValue: true },
		}),
	]);

	const coImpact = coAgg._sum.costImpact ? Number(coAgg._sum.costImpact) : 0;

	// No contract record → fall back to the raw project contract value
	// (no VAT info available).
	if (!contract) {
		const base = project?.contractValue ? Number(project.contractValue) : 0;
		return { base, vatAmount: 0, total: base + coImpact };
	}

	// Stored value is NET (pre-VAT). Add VAT only on the contract value when the
	// contract is subject to it; change orders are already VAT-inclusive.
	const netValue = Number(contract.value);
	const vatPercent =
		contract.vatPercent != null ? Number(contract.vatPercent) : 15;
	const vatAmount = contract.includesVat
		? netValue * (vatPercent / 100)
		: 0;
	const valueWithVat = netValue + vatAmount;
	return { base: netValue, vatAmount, total: valueWithVat + coImpact };
}

/**
 * Get owner summary (for portal home page)
 */
export async function getOwnerSummary(organizationId: string, projectId: string) {
	const [
		project,
		latestProgressUpdate,
		latestOfficialUpdate,
		upcomingClaim,
		milestones,
		contractTotal,
		projectPaymentsAgg,
		financePaymentsAgg,
		changeOrdersAgg,
		photosCount,
		recentPhotos,
		lastMessage,
	] = await Promise.all([
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
				coverPhoto: {
					select: { id: true, url: true, caption: true },
				},
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
		// Execution milestones → progress mirrors the execution dashboard.
		// Ordered by orderIndex so the schedule snapshot can derive the
		// current/next stage the same way the schedule page does.
		db.projectMilestone.findMany({
			where: { organizationId, projectId },
			orderBy: { orderIndex: "asc" },
			select: {
				id: true,
				title: true,
				status: true,
				progress: true,
				orderIndex: true,
			},
		}),
		computeContractTotal(organizationId, projectId),
		// Payments snapshot — aggregate BOTH receipt systems (see getOwnerPayments)
		db.projectPayment.aggregate({
			where: { organizationId, projectId },
			_sum: { amount: true },
		}),
		db.financePayment.aggregate({
			where: { organizationId, projectId, status: "COMPLETED" },
			_sum: { amount: true },
		}),
		// Change orders snapshot — count + total cost impact (owner-visible only)
		db.projectChangeOrder.aggregate({
			where: {
				organizationId,
				projectId,
				status: { in: ["APPROVED", "IMPLEMENTED"] },
			},
			_count: true,
			_sum: { costImpact: true },
		}),
		// Photos snapshot — total count + a few recent thumbnails
		db.projectPhoto.count({ where: { projectId } }),
		db.projectPhoto.findMany({
			where: { projectId },
			orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
			take: 4,
			select: { id: true, url: true, caption: true, mediaType: true },
		}),
		// Chat snapshot — latest message on the OWNER channel (any type)
		db.projectMessage.findFirst({
			where: { organizationId, projectId, channel: "OWNER" },
			orderBy: { createdAt: "desc" },
			select: {
				content: true,
				createdAt: true,
				isUpdate: true,
				sender: { select: { name: true } },
			},
		}),
	]);

	// Overall progress = average of milestone progress (same formula as
	// getExecutionDashboard). Fall back to the stored project.progress only
	// when there are no execution milestones at all.
	const milestoneProgress =
		milestones.length > 0
			? Math.round(
					milestones.reduce((sum, m) => sum + Number(m.progress), 0) /
						milestones.length,
				)
			: project?.progress != null
				? Math.round(Number(project.progress))
				: 0;

	// ── Schedule snapshot ────────────────────────────────────────────────
	const completedMilestones = milestones.filter(
		(m) => m.status === "COMPLETED",
	).length;
	// Current stage = the one in progress, else the first not-yet-completed one.
	const currentMilestone =
		milestones.find((m) => m.status === "IN_PROGRESS") ??
		milestones.find((m) => m.status !== "COMPLETED") ??
		null;

	// ── Payments snapshot ────────────────────────────────────────────────
	const paidAmount = round2(
		Number(projectPaymentsAgg._sum.amount ?? 0) +
			Number(financePaymentsAgg._sum.amount ?? 0),
	);
	const contractValue = contractTotal.total;
	const collectionPercent =
		contractValue > 0 ? Math.round((paidAmount / contractValue) * 100) : 0;

	const STARTS_WITH_OWNER = "[من المالك]";

	return {
		project: project ? { ...project, progress: milestoneProgress } : project,
		contractValueWithVat: contractTotal.total,
		currentPhase: latestProgressUpdate?.phaseLabel ?? null,
		latestOfficialUpdate,
		upcomingPayment: upcomingClaim,
		sections: {
			schedule: {
				total: milestones.length,
				completed: completedMilestones,
				current: currentMilestone
					? {
							title: currentMilestone.title,
							progress: Number(currentMilestone.progress),
							status: currentMilestone.status,
						}
					: null,
			},
			payments: {
				collectionPercent,
				paidAmount,
				remaining: round2(contractValue - paidAmount),
				contractValue,
				nextPayment: upcomingClaim
					? {
							claimNo: upcomingClaim.claimNo,
							amount: Number(upcomingClaim.amount),
							dueDate: upcomingClaim.dueDate,
						}
					: null,
			},
			photos: {
				count: photosCount,
				recent: recentPhotos.map((p) => ({
					id: p.id,
					url: p.url,
					caption: p.caption,
					mediaType: p.mediaType,
				})),
			},
			changeOrders: {
				count: changeOrdersAgg._count,
				totalCostImpact: Number(changeOrdersAgg._sum.costImpact ?? 0),
			},
			chat: {
				lastMessage: lastMessage
					? {
							content: lastMessage.content.startsWith(STARTS_WITH_OWNER)
								? lastMessage.content.replace(`${STARTS_WITH_OWNER} `, "")
								: lastMessage.content,
							senderName: lastMessage.sender?.name ?? null,
							createdAt: lastMessage.createdAt,
							isOwner: lastMessage.content.startsWith(STARTS_WITH_OWNER),
						}
					: null,
			},
		},
	};
}

/**
 * Get owner schedule (milestones)
 */
export async function getOwnerSchedule(organizationId: string, projectId: string) {
	// Mirror the execution section: read the new milestone fields and order
	// by orderIndex (NOT the legacy sortOrder/plannedDate/isCompleted fields).
	const milestones = await db.projectMilestone.findMany({
		where: { organizationId, projectId },
		orderBy: { orderIndex: "asc" },
		select: {
			id: true,
			title: true,
			description: true,
			orderIndex: true,
			plannedStart: true,
			plannedEnd: true,
			actualStart: true,
			actualEnd: true,
			status: true,
			progress: true,
			isCritical: true,
		},
	});

	// If no milestones exist, generate default phases from project dates
	if (milestones.length === 0) {
		const project = await db.project.findFirst({
			where: { id: projectId, organizationId },
			select: { startDate: true, endDate: true },
		});

		const defaultPhases = [
			"بداية المشروع",
			"الأساسات",
			"الهيكل الخرساني",
			"التشطيبات",
			"التسليم",
		];

		return defaultPhases.map((title, index) => ({
			id: `default-${index}`,
			title,
			description: null,
			orderIndex: index,
			plannedStart: project?.startDate ?? null,
			plannedEnd: project?.endDate ?? null,
			actualStart: null,
			actualEnd: null,
			status: "PLANNED" as const,
			progress: 0,
			isCritical: false,
		}));
	}

	return milestones.map((m) => ({
		...m,
		progress: Number(m.progress),
	}));
}

/**
 * Get owner payments (claims summary - no expenses)
 */
export async function getOwnerPayments(organizationId: string, projectId: string) {
	// The platform records project receipts through TWO independent paths:
	//   • ProjectPayment   — the dedicated project-payments module
	//   • FinancePayment    — the general finance receipts module (orgPayments)
	// Both can link to a contract payment term, and neither writes into the
	// other's table. The owner portal must aggregate BOTH so that the totals,
	// the per-stage progress, and the payments list all agree — otherwise
	// stages read as unpaid while money was actually collected (the original bug).
	const [contractTotal, contract, projectPayments, financePayments, claims] =
		await Promise.all([
			computeContractTotal(organizationId, projectId),
			db.projectContract.findFirst({
				where: { organizationId, projectId },
				select: {
					id: true,
					paymentTerms: {
						orderBy: { sortOrder: "asc" },
						select: {
							id: true,
							type: true,
							label: true,
							percent: true,
							amount: true,
							sortOrder: true,
						},
					},
				},
			}),
			db.projectPayment.findMany({
				where: { organizationId, projectId },
				orderBy: { date: "desc" },
				select: {
					id: true,
					paymentNo: true,
					amount: true,
					date: true,
					description: true,
					contractTermId: true,
					contractTerm: { select: { label: true } },
				},
			}),
			db.financePayment.findMany({
				where: { organizationId, projectId, status: "COMPLETED" },
				orderBy: { date: "desc" },
				select: {
					id: true,
					paymentNo: true,
					amount: true,
					date: true,
					description: true,
					contractTermId: true,
					contractTerm: { select: { label: true } },
				},
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
		]);

	// Normalize every recorded receipt from both systems into one shape.
	const allPayments = [...projectPayments, ...financePayments]
		.map((p) => ({
			id: p.id,
			paymentNo: p.paymentNo,
			amount: Number(p.amount),
			date: p.date,
			description: p.description ?? null,
			contractTermId: p.contractTermId,
			termLabel: p.contractTerm?.label ?? null,
		}))
		.sort((a, b) => {
			const ta = a.date ? new Date(a.date).getTime() : 0;
			const tb = b.date ? new Date(b.date).getTime() : 0;
			return tb - ta;
		});

	const contractValue = contractTotal.total;
	const paidAmount = round2(allPayments.reduce((sum, p) => sum + p.amount, 0));
	const remaining = round2(contractValue - paidAmount);

	// Sum of what's been collected against each contract term (both systems).
	const paidByTerm = new Map<string, number>();
	for (const p of allPayments) {
		if (!p.contractTermId) continue;
		paidByTerm.set(
			p.contractTermId,
			(paidByTerm.get(p.contractTermId) ?? 0) + p.amount,
		);
	}

	// Base for percent-based stage amounts: contract value + VAT (change orders
	// are billed separately), matching the internal payment-terms calculation.
	const termBase = contractTotal.base + contractTotal.vatAmount;

	let currentTermId: string | null = null;
	const terms = (contract?.paymentTerms ?? []).map((term) => {
		const amount = term.amount
			? Number(term.amount)
			: term.percent
				? round2((termBase * Number(term.percent)) / 100)
				: 0;
		const paid = round2(paidByTerm.get(term.id) ?? 0);
		const remainingAmount = Math.max(0, round2(amount - paid));
		const progressPercent =
			amount > 0 ? Math.min(100, (paid / amount) * 100) : 0;
		// Treat a stage as complete once paid covers it (tolerate rounding).
		const isComplete = amount > 0 && paid >= amount - 0.01;

		// Current stage = first incomplete term in order.
		if (!isComplete && !currentTermId) {
			currentTermId = term.id;
		}

		return {
			id: term.id,
			type: term.type,
			label: term.label,
			amount,
			paidAmount: paid,
			remainingAmount,
			progressPercent,
			isComplete,
		};
	});

	const currentTerm = terms.find((t) => t.id === currentTermId) ?? null;
	const dueOnCurrentStage = currentTerm ? currentTerm.remainingAmount : 0;

	return {
		// Totals
		contractValue,
		contractBase: contractTotal.base,
		vatAmount: contractTotal.vatAmount,
		paidAmount,
		remaining,
		collectionPercent:
			contractValue > 0
				? Math.round((paidAmount / contractValue) * 100)
				: 0,
		// Current stage (المرحلة الحالية)
		currentTermId,
		dueOnCurrentStage,
		// Payment terms / stages (owner-safe fields only)
		terms,
		// Every recorded payment (owner-safe fields only)
		payments: allPayments.map((p) => ({
			id: p.id,
			paymentNo: p.paymentNo,
			amount: p.amount,
			date: p.date,
			description: p.description,
			termLabel: p.termLabel,
		})),
		// Claims / مستخلصات
		claims: claims.map((c) => ({
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
// Photos for owner portal - الصور (للقراءة فقط)
// ═══════════════════════════════════════════════════════════════════════════

export async function getOwnerPortalPhotos(
	organizationId: string,
	projectId: string,
	options?: { limit?: number },
) {
	// Verify project belongs to organization (defense in depth)
	const project = await db.project.findFirst({
		where: { id: projectId, organizationId },
		select: { id: true, coverPhotoId: true },
	});
	if (!project) {
		return { photos: [], coverPhotoId: null };
	}

	const photos = await db.projectPhoto.findMany({
		where: { projectId },
		select: {
			id: true,
			url: true,
			caption: true,
			category: true,
			mediaType: true,
			mimeType: true,
			takenAt: true,
			createdAt: true,
			milestone: { select: { id: true, title: true, orderIndex: true } },
		},
		orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
		take: options?.limit ?? 500,
	});

	return { photos, coverPhotoId: project.coverPhotoId };
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

// ═══════════════════════════════════════════════════════════════════════════
// Token Cleanup
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Delete expired portal sessions and expired/revoked access tokens.
 * Called by a daily cron job to prevent stale data accumulation.
 */
export async function cleanupExpiredTokens(): Promise<{
	deletedSessions: number;
	deletedTokens: number;
}> {
	const now = new Date();

	// 1. Delete expired sessions first
	const sessionResult = await db.ownerPortalSession.deleteMany({
		where: { expiresAt: { lt: now } },
	});

	// 2. Delete expired or revoked access tokens (cascade deletes remaining sessions)
	const tokenResult = await db.projectOwnerAccess.deleteMany({
		where: {
			OR: [
				{ expiresAt: { lt: now } },
				{ isRevoked: true },
			],
		},
	});

	return {
		deletedSessions: sessionResult.count,
		deletedTokens: tokenResult.count,
	};
}

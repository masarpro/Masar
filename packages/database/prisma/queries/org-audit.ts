import { db } from "../client";
import type { Prisma, OrgAuditAction } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Organization Audit Log — سجل التدقيق المؤسسي
// Fire-and-forget pattern: errors are logged but never block the caller.
// Retention: 7 years minimum (Saudi ZATCA regulations).
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log a single organization-level audit event.
 * This is fire-and-forget — the returned promise resolves immediately
 * and errors are swallowed to avoid blocking business operations.
 */
export function orgAuditLog(params: {
	organizationId: string;
	actorId: string;
	action: OrgAuditAction;
	entityType: string;
	entityId: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
}): void {
	db.organizationAuditLog
		.create({
			data: {
				organizationId: params.organizationId,
				actorId: params.actorId,
				action: params.action,
				entityType: params.entityType,
				entityId: params.entityId,
				metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
				ipAddress: params.ipAddress ?? null,
			},
		})
		.catch((error) => {
			console.error("[ORG_AUDIT] Failed to log audit event:", {
				action: params.action,
				entityType: params.entityType,
				entityId: params.entityId,
				error: error instanceof Error ? error.message : error,
			});
		});
}

/**
 * Log multiple audit events in a single batch.
 * Fire-and-forget, same as `orgAuditLog`.
 */
export function orgAuditLogMany(
	events: Array<{
		organizationId: string;
		actorId: string;
		action: OrgAuditAction;
		entityType: string;
		entityId: string;
		metadata?: Record<string, unknown>;
		ipAddress?: string;
	}>,
): void {
	if (events.length === 0) return;

	db.organizationAuditLog
		.createMany({
			data: events.map((e) => ({
				organizationId: e.organizationId,
				actorId: e.actorId,
				action: e.action,
				entityType: e.entityType,
				entityId: e.entityId,
				metadata: (e.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
				ipAddress: e.ipAddress ?? null,
			})),
		})
		.catch((error) => {
			console.error("[ORG_AUDIT] Failed to log batch audit events:", {
				count: events.length,
				error: error instanceof Error ? error.message : error,
			});
		});
}

// ═══════════════════════════════════════════════════════════════════════════
// Query Helpers — استعلام سجل التدقيق
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List audit logs for an organization with pagination and optional filters.
 */
export async function getOrganizationAuditLogs(
	organizationId: string,
	options?: {
		limit?: number;
		offset?: number;
		entityType?: string;
		entityId?: string;
		action?: OrgAuditAction;
		actorId?: string;
		from?: Date;
		to?: Date;
	},
) {
	const where: Prisma.OrganizationAuditLogWhereInput = { organizationId };

	if (options?.entityType) where.entityType = options.entityType;
	if (options?.entityId) where.entityId = options.entityId;
	if (options?.action) where.action = options.action;
	if (options?.actorId) where.actorId = options.actorId;
	if (options?.from || options?.to) {
		where.createdAt = {};
		if (options.from) where.createdAt.gte = options.from;
		if (options.to) where.createdAt.lte = options.to;
	}

	const [logs, total] = await Promise.all([
		db.organizationAuditLog.findMany({
			where,
			include: {
				actor: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.organizationAuditLog.count({ where }),
	]);

	return { logs, total };
}

/**
 * Get audit trail for a specific entity (e.g., all events for invoice X).
 */
export async function getEntityOrgAuditLogs(
	organizationId: string,
	entityType: string,
	entityId: string,
	options?: { limit?: number },
) {
	return db.organizationAuditLog.findMany({
		where: { organizationId, entityType, entityId },
		include: {
			actor: { select: { id: true, name: true, image: true } },
		},
		orderBy: { createdAt: "desc" },
		take: options?.limit ?? 50,
	});
}

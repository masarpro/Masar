import { db } from "../client";
import type { Prisma, AuditAction } from "../generated/client";

// Entity types for audit logging
export type AuditEntityType =
	| "document"
	| "approval"
	| "message"
	| "claim"
	| "expense"
	| "token"
	| "attachment"
	| "issue"
	| "photo"
	| "report"
	| "contract";

// ═══════════════════════════════════════════════════════════════════════════
// Audit Log Queries - سجل التدقيق
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log an audit event
 */
export async function logAuditEvent(
	organizationId: string,
	projectId: string,
	data: {
		actorId: string;
		action: AuditAction;
		entityType: string;
		entityId: string;
		metadata?: Prisma.InputJsonValue;
	},
) {
	return db.projectAuditLog.create({
		data: {
			organizationId,
			projectId,
			actorId: data.actorId,
			action: data.action,
			entityType: data.entityType,
			entityId: data.entityId,
			metadata: data.metadata,
		},
	});
}

/**
 * Get audit logs for a project
 */
export async function getProjectAuditLogs(
	organizationId: string,
	projectId: string,
	options?: {
		limit?: number;
		offset?: number;
		entityType?: string;
		entityId?: string;
	},
) {
	const where: {
		organizationId: string;
		projectId: string;
		entityType?: string;
		entityId?: string;
	} = { organizationId, projectId };

	if (options?.entityType) {
		where.entityType = options.entityType;
	}

	if (options?.entityId) {
		where.entityId = options.entityId;
	}

	const [logs, total] = await Promise.all([
		db.projectAuditLog.findMany({
			where,
			include: {
				actor: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.projectAuditLog.count({ where }),
	]);

	return { logs, total };
}

/**
 * Get audit logs for a specific entity (e.g., document, approval)
 */
export async function getEntityAuditLogs(
	organizationId: string,
	projectId: string,
	entityType: string,
	entityId: string,
	options?: {
		limit?: number;
	},
) {
	return db.projectAuditLog.findMany({
		where: {
			organizationId,
			projectId,
			entityType,
			entityId,
		},
		include: {
			actor: { select: { id: true, name: true, image: true } },
		},
		orderBy: { createdAt: "desc" },
		take: options?.limit ?? 20,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Audit Helper (Phase 6) - مساعد التدقيق
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simple audit logger for common actions
 * This is a fire-and-forget helper - errors are logged but don't block
 */
export async function auditLog(params: {
	organizationId: string;
	projectId: string;
	actorId: string;
	action: AuditAction;
	entityType: AuditEntityType;
	entityId: string;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	try {
		await db.projectAuditLog.create({
			data: {
				organizationId: params.organizationId,
				projectId: params.projectId,
				actorId: params.actorId,
				action: params.action,
				entityType: params.entityType,
				entityId: params.entityId,
				metadata: params.metadata as Prisma.InputJsonValue,
			},
		});
	} catch (error) {
		// Log error but don't throw - audit should not block operations
		console.error("[AUDIT] Failed to log audit event:", error);
	}
}

/**
 * Batch audit logger for multiple events
 */
export async function auditLogMany(
	events: Array<{
		organizationId: string;
		projectId: string;
		actorId: string;
		action: AuditAction;
		entityType: AuditEntityType;
		entityId: string;
		metadata?: Record<string, unknown>;
	}>,
): Promise<void> {
	try {
		await db.projectAuditLog.createMany({
			data: events.map((e) => ({
				organizationId: e.organizationId,
				projectId: e.projectId,
				actorId: e.actorId,
				action: e.action,
				entityType: e.entityType,
				entityId: e.entityId,
				metadata: e.metadata as Prisma.InputJsonValue,
			})),
		});
	} catch (error) {
		console.error("[AUDIT] Failed to log batch audit events:", error);
	}
}

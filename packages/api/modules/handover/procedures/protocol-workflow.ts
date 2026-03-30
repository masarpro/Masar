// Handover Protocols — Workflow: Submit, Sign, Complete

// TODO(#113): Add digital signature identity verification (OTP/biometric)

import { db, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { ORPCError } from "@orpc/server";
import { Prisma } from "@repo/database/prisma/generated/client";
import { idString, MAX_ARRAY } from "../../../lib/validation-constants";
import type { HandoverParty } from "./shared";

// ═══════════════════════════════════════════════════════════════════════════
// 11. SUBMIT HANDOVER PROTOCOL (DRAFT → PENDING_SIGNATURES)
// ═══════════════════════════════════════════════════════════════════════════
export const submitHandoverProtocol = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{id}/submit",
		tags: ["Handover"],
		summary: "Submit protocol for signatures",
	})
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			include: { _count: { select: { items: true } } },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (protocol.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", { message: "يمكن تقديم المسودات فقط" });
		}

		// Validate: at least 1 item and 1 party
		if (protocol._count.items === 0) {
			throw new ORPCError("BAD_REQUEST", { message: "المحضر يجب أن يحتوي على بند واحد على الأقل" });
		}
		const parties = (protocol.parties as unknown as HandoverParty[] | null) ?? [];
		if (parties.length === 0) {
			throw new ORPCError("BAD_REQUEST", { message: "المحضر يجب أن يحتوي على طرف واحد على الأقل" });
		}

		const updated = await db.handoverProtocol.update({
			where: { id: input.id },
			data: { status: "PENDING_SIGNATURES" },
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_SUBMITTED",
			entityType: "handover_protocol",
			entityId: input.id,
			metadata: { protocolNo: protocol.protocolNo },
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// 12. SIGN HANDOVER PROTOCOL (party by index)
// ═══════════════════════════════════════════════════════════════════════════
export const signHandoverProtocol = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{id}/sign",
		tags: ["Handover"],
		summary: "Sign a handover protocol (by party index)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			partyIndex: z.number().int().nonnegative().max(MAX_ARRAY),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (!["PENDING_SIGNATURES", "PARTIALLY_SIGNED"].includes(protocol.status)) {
			throw new ORPCError("BAD_REQUEST", { message: "المحضر ليس بحالة انتظار التوقيعات" });
		}

		const parties = (protocol.parties as unknown as HandoverParty[] | null) ?? [];
		if (input.partyIndex >= parties.length) {
			throw new ORPCError("BAD_REQUEST", { message: "فهرس الطرف غير صحيح" });
		}
		if (parties[input.partyIndex].signed) {
			throw new ORPCError("BAD_REQUEST", { message: "هذا الطرف وقّع بالفعل" });
		}

		// Update the party signature
		parties[input.partyIndex].signed = true;
		parties[input.partyIndex].signedAt = new Date().toISOString();

		// Check if all parties signed
		const allSigned = parties.every((p) => p.signed);
		const newStatus = allSigned ? "COMPLETED" : "PARTIALLY_SIGNED";

		const updateData: Prisma.HandoverProtocolUpdateInput = {
			parties: parties as unknown as Prisma.InputJsonValue,
			status: newStatus,
		};

		if (allSigned) {
			updateData.completedAt = new Date();
			if (protocol.type === "PRELIMINARY" && !protocol.warrantyStartDate) {
				updateData.warrantyStartDate = protocol.date;
			}
		}

		const updated = await db.handoverProtocol.update({
			where: { id: input.id },
			data: updateData,
		});

		// If FINAL + COMPLETED + has retention → release retention via accounting
		if (allSigned && protocol.type === "FINAL" && protocol.retentionReleaseAmount) {
			const retentionAmount = Number(protocol.retentionReleaseAmount);
			if (retentionAmount > 0) {
				try {
					const { onFinalHandoverCompleted } = await import(
						"../../../lib/accounting/auto-journal"
					);
					await onFinalHandoverCompleted(db, {
						id: protocol.id,
						organizationId: protocol.organizationId,
						protocolNo: protocol.protocolNo,
						retentionReleaseAmount: protocol.retentionReleaseAmount,
						projectId: protocol.projectId,
						date: protocol.date,
						userId: context.user.id,
					});
				} catch (e) {
					console.error("[AutoJournal] Failed to create retention release entry:", e);
					orgAuditLog({
						organizationId: input.organizationId,
						actorId: context.user.id,
						action: "JOURNAL_ENTRY_FAILED",
						entityType: "journal_entry",
						entityId: input.id,
						metadata: { error: String(e), referenceType: "RETENTION_RELEASE" },
					});
				}
			}
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_SIGNED",
			entityType: "handover_protocol",
			entityId: input.id,
			metadata: { partyIndex: input.partyIndex, newStatus, protocolNo: protocol.protocolNo },
		});

		return updated;
	});

// ═══════════════════════════════════════════════════════════════════════════
// 13. COMPLETE HANDOVER PROTOCOL (manual completion)
// ═══════════════════════════════════════════════════════════════════════════
export const completeHandoverProtocol = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{id}/complete",
		tags: ["Handover"],
		summary: "Complete a handover protocol manually",
	})
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "edit",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});
		if (!protocol) throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		if (!["PENDING_SIGNATURES", "PARTIALLY_SIGNED"].includes(protocol.status)) {
			throw new ORPCError("BAD_REQUEST", { message: "لا يمكن إكمال هذا المحضر" });
		}

		const updateData: Prisma.HandoverProtocolUpdateInput = {
			status: "COMPLETED",
			completedAt: new Date(),
		};

		if (protocol.type === "PRELIMINARY" && !protocol.warrantyStartDate) {
			updateData.warrantyStartDate = protocol.date;
		}

		const updated = await db.handoverProtocol.update({
			where: { id: input.id },
			data: updateData,
		});

		// If FINAL + has retention → release retention
		if (protocol.type === "FINAL" && protocol.retentionReleaseAmount) {
			const retentionAmount = Number(protocol.retentionReleaseAmount);
			if (retentionAmount > 0) {
				try {
					const { onFinalHandoverCompleted } = await import(
						"../../../lib/accounting/auto-journal"
					);
					await onFinalHandoverCompleted(db, {
						id: protocol.id,
						organizationId: protocol.organizationId,
						protocolNo: protocol.protocolNo,
						retentionReleaseAmount: protocol.retentionReleaseAmount,
						projectId: protocol.projectId,
						date: protocol.date,
						userId: context.user.id,
					});
				} catch (e) {
					console.error("[AutoJournal] Failed to create retention release entry:", e);
					orgAuditLog({
						organizationId: input.organizationId,
						actorId: context.user.id,
						action: "JOURNAL_ENTRY_FAILED",
						entityType: "journal_entry",
						entityId: input.id,
						metadata: { error: String(e), referenceType: "RETENTION_RELEASE" },
					});
				}
			}
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_COMPLETED",
			entityType: "handover_protocol",
			entityId: input.id,
			metadata: { protocolNo: protocol.protocolNo },
		});

		return updated;
	});

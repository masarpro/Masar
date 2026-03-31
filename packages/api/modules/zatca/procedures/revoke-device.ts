// ZATCA Revoke Device — إلغاء الربط مع زاتكا

import { db, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const revokeDevice = subscriptionProcedure
	.route({
		method: "POST",
		path: "/zatca/devices/revoke",
		tags: ["ZATCA"],
		summary: "Revoke a ZATCA device (disable integration)",
	})
	.input(
		z.object({
			organizationId: idString(),
			deviceId: idString(),
			reason: z.string().trim().max(500).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "integrations",
		});

		const device = await db.zatcaDevice.findFirst({
			where: {
				id: input.deviceId,
				organizationId: input.organizationId,
			},
		});

		if (!device) {
			throw new ORPCError("NOT_FOUND", { message: "الجهاز غير موجود" });
		}

		if (device.status === "REVOKED" || device.status === "DISABLED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "الجهاز معطّل بالفعل",
			});
		}

		// Check for pending submissions
		const pendingCount = await db.zatcaSubmission.count({
			where: {
				deviceId: device.id,
				status: { in: ["PENDING", "SUBMITTED"] },
			},
		});

		if (pendingCount > 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: `يوجد ${pendingCount} فاتورة معلّقة. انتظر حتى تكتمل قبل إلغاء الربط.`,
			});
		}

		const updated = await db.zatcaDevice.update({
			where: { id: device.id },
			data: {
				status: "REVOKED",
				lastError: input.reason
					? `إلغاء يدوي: ${input.reason}`
					: "إلغاء يدوي بواسطة المستخدم",
				// Clear sensitive data
				csidSecret: null,
				privateKey: null,
				complianceSecret: null,
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "SETTINGS_UPDATED",
			entityType: "ZatcaDevice",
			entityId: device.id,
			metadata: {
				action: "zatca_revoke",
				invoiceType: device.invoiceType,
				reason: input.reason,
			},
		});

		return {
			success: true,
			deviceId: updated.id,
			message: "تم إلغاء الربط مع زاتكا",
		};
	});

// ZATCA Complete Onboarding — إكمال التسجيل (Compliance → Production CSID)
// Used when start-onboarding left device in COMPLIANCE status

import { db, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";
import {
	decryptSecret,
	encryptSecret,
	requestProductionCSID,
} from "../../../lib/zatca/phase2";

export const completeOnboarding = subscriptionProcedure
	.route({
		method: "POST",
		path: "/zatca/onboarding/complete",
		tags: ["ZATCA"],
		summary: "Complete ZATCA onboarding — request Production CSID",
	})
	.input(
		z.object({
			organizationId: idString(),
			deviceId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "edit",
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

		if (device.status !== "COMPLIANCE") {
			throw new ORPCError("BAD_REQUEST", {
				message: "الجهاز ليس في حالة الاختبار",
			});
		}

		if (!device.complianceCsid || !device.complianceSecret || !device.csidRequestId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "بيانات شهادة الاختبار مفقودة. أعد التسجيل.",
			});
		}

		const complianceSecret = decryptSecret(device.complianceSecret);

		const result = await requestProductionCSID(
			device.csidRequestId,
			device.complianceCsid,
			complianceSecret,
		);

		if (!result.success || !result.csid || !result.secret) {
			await db.zatcaDevice.update({
				where: { id: device.id },
				data: {
					lastError: result.errors?.map((e) => e.message).join("; "),
				},
			});

			throw new ORPCError("BAD_REQUEST", {
				message: `فشل الحصول على شهادة الإنتاج: ${result.errors?.map((e) => e.message).join(", ") || "خطأ غير معروف"}`,
			});
		}

		const updated = await db.zatcaDevice.update({
			where: { id: device.id },
			data: {
				status: "ACTIVE",
				csidCertificate: result.csid,
				csidSecret: encryptSecret(result.secret),
				csidRequestId: result.requestId,
				onboardedAt: new Date(),
				lastError: null,
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			userId: context.user.id,
			action: "SETTINGS_UPDATED",
			entity: "ZatcaDevice",
			entityId: device.id,
			details: {
				action: "zatca_onboarding_complete",
				invoiceType: device.invoiceType,
			},
		});

		return {
			success: true,
			status: "ACTIVE" as const,
			deviceId: updated.id,
			message: "تم التسجيل بنجاح مع زاتكا",
		};
	});

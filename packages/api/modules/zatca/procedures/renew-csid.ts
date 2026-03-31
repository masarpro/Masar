// ZATCA Renew Production CSID — تجديد شهادة الإنتاج
// Uses PATCH /production/csids per ZATCA spec (not POST)

import { db, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";
import {
	generateCSR,
	decryptSecret,
	encryptSecret,
	renewProductionCSID,
	SANDBOX_DEFAULTS,
} from "../../../lib/zatca/phase2";

export const renewCsid = subscriptionProcedure
	.route({
		method: "POST",
		path: "/zatca/csid/renew",
		tags: ["ZATCA"],
		summary: "Renew an expiring ZATCA production certificate",
	})
	.input(
		z.object({
			organizationId: idString(),
			deviceId: idString(),
			otp: z.string().trim().length(6, "رمز OTP يجب أن يكون 6 أرقام"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "integrations",
		});

		// 1. Load device
		const device = await db.zatcaDevice.findFirst({
			where: {
				id: input.deviceId,
				organizationId: input.organizationId,
			},
		});

		if (!device) {
			throw new ORPCError("NOT_FOUND", { message: "الجهاز غير موجود" });
		}

		if (device.status !== "ACTIVE" && device.status !== "EXPIRED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "يمكن تجديد الشهادة فقط للأجهزة النشطة أو منتهية الصلاحية",
			});
		}

		if (!device.csidCertificate || !device.csidSecret) {
			throw new ORPCError("BAD_REQUEST", {
				message: "بيانات الشهادة الحالية مفقودة. أعد التسجيل.",
			});
		}

		// 2. Load organization
		const org = await db.organization.findUnique({
			where: { id: input.organizationId },
			select: {
				name: true,
				taxNumber: true,
				city: true,
			},
		});

		if (!org?.taxNumber) {
			throw new ORPCError("BAD_REQUEST", {
				message: "الرقم الضريبي مطلوب",
			});
		}

		const cleanTaxNumber = org.taxNumber.replace(/[\s-]/g, "");

		// 3. Generate new CSR for renewal
		const csrResult = await generateCSR({
			organizationName: org.name,
			vatNumber: cleanTaxNumber,
			invoiceType: device.invoiceType === "STANDARD" ? "1000" : "0100",
			location: org.city || "Jeddah",
			industry: "Construction",
		});

		// 4. Call PATCH /production/csids
		const currentSecret = decryptSecret(device.csidSecret);
		const env = process.env.ZATCA_ENVIRONMENT || "sandbox";
		const effectiveOtp = env === "sandbox" ? SANDBOX_DEFAULTS.otp : input.otp;

		const result = await renewProductionCSID(
			csrResult.csr,
			effectiveOtp,
			device.csidCertificate,
			currentSecret,
		);

		if (!result.success) {
			await db.zatcaDevice.update({
				where: { id: device.id },
				data: {
					lastError: result.errors?.map((e) => e.message).join("; "),
				},
			});

			throw new ORPCError("BAD_REQUEST", {
				message: `فشل تجديد الشهادة: ${result.errors?.map((e) => e.message).join(", ") || "خطأ غير معروف"}`,
			});
		}

		// 5. Update device with new certificate
		const updated = await db.zatcaDevice.update({
			where: { id: device.id },
			data: {
				status: "ACTIVE",
				csidCertificate: result.csid!,
				csidSecret: encryptSecret(result.secret!),
				csidRequestId: result.requestId,
				privateKey: encryptSecret(csrResult.privateKey),
				publicKey: csrResult.publicKey,
				lastError: null,
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "SETTINGS_UPDATED",
			entityType: "ZatcaDevice",
			entityId: device.id,
			metadata: {
				action: "zatca_csid_renewal",
				invoiceType: device.invoiceType,
			},
		});

		return {
			success: true,
			deviceId: updated.id,
			message: "تم تجديد الشهادة بنجاح",
		};
	});

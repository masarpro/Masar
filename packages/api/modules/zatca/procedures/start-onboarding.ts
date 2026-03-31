// ZATCA Onboarding — بدء التسجيل مع زاتكا
// Full flow: CSR → Compliance CSID → Test Invoice → Production CSID

import { db, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";
import {
	generateCSR,
	encryptSecret,
	requestComplianceCSID,
	submitComplianceInvoice,
	requestProductionCSID,
	buildInvoiceXml,
	signInvoice,
	getInitialPIH,
} from "../../../lib/zatca/phase2";
import type { ZatcaInvoiceData } from "../../../lib/zatca/phase2";
import { v4 as uuidv4 } from "uuid";

export const startOnboarding = subscriptionProcedure
	.route({
		method: "POST",
		path: "/zatca/onboarding/start",
		tags: ["ZATCA"],
		summary: "Start ZATCA Phase 2 onboarding",
	})
	.input(
		z.object({
			organizationId: idString(),
			otp: z.string().trim().length(6, "رمز OTP يجب أن يكون 6 أرقام"),
			invoiceType: z.enum(["STANDARD", "SIMPLIFIED"]),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "integrations",
		});

		// 1. Get organization details (tax number may be in financeSettings or Organization)
		const org = await db.organization.findUnique({
			where: { id: input.organizationId },
			select: {
				id: true,
				name: true,
				taxNumber: true,
				commercialRegister: true,
				address: true,
				city: true,
				financeSettings: {
					select: { taxNumber: true, commercialRegister: true },
				},
			},
		});

		if (!org) {
			throw new ORPCError("NOT_FOUND", { message: "المنظمة غير موجودة" });
		}

		// Prefer financeSettings (where /settings/general saves), fallback to Organization
		const resolvedTaxNumber = org.financeSettings?.taxNumber || org.taxNumber;

		if (!resolvedTaxNumber || !/^\d{15}$/.test(resolvedTaxNumber.replace(/[\s-]/g, ""))) {
			throw new ORPCError("BAD_REQUEST", {
				message: "أضف الرقم الضريبي (15 رقم) في إعدادات المنظمة أولاً",
			});
		}

		const cleanTaxNumber = resolvedTaxNumber.replace(/[\s-]/g, "");

		// 2. Check for existing active device
		const existingDevice = await db.zatcaDevice.findFirst({
			where: {
				organizationId: input.organizationId,
				invoiceType: input.invoiceType,
				status: { in: ["ACTIVE", "COMPLIANCE", "ONBOARDING"] },
			},
		});

		if (existingDevice) {
			throw new ORPCError("CONFLICT", {
				message: `يوجد جهاز ${input.invoiceType === "STANDARD" ? "فواتير ضريبية" : "فواتير مبسّطة"} مسجّل بالفعل`,
			});
		}

		// 3. Generate CSR + key pair
		const csrResult = await generateCSR({
			organizationName: org.name,
			vatNumber: cleanTaxNumber,
			invoiceType: input.invoiceType === "STANDARD" ? "1000" : "0100",
			location: org.city || "Jeddah",
			industry: "Construction",
		});

		// 4. Request Compliance CSID from ZATCA
		const complianceResult = await requestComplianceCSID(csrResult.csr, input.otp);

		if (!complianceResult.success || !complianceResult.csid || !complianceResult.secret) {
			throw new ORPCError("BAD_REQUEST", {
				message: `فشل التسجيل مع زاتكا: ${complianceResult.errors?.map((e) => e.message).join(", ") || "خطأ غير معروف"}`,
			});
		}

		// 5. Build and send a test invoice for compliance check
		const testUuid = uuidv4();
		const testInvoiceData: ZatcaInvoiceData = {
			uuid: testUuid,
			invoiceNumber: "TEST-0001",
			issueDate: new Date().toISOString().split("T")[0]!,
			issueTime: new Date().toISOString().split("T")[1]!.replace(/\.\d+Z/, ""),
			invoiceTypeCode: "388",
			isSimplified: input.invoiceType === "SIMPLIFIED",
			seller: {
				name: org.name,
				taxNumber: cleanTaxNumber,
				crNumber: org.commercialRegister ?? undefined,
				address: {
					street: org.address ?? undefined,
					city: org.city ?? "Jeddah",
					countryCode: "SA",
				},
			},
			buyer:
				input.invoiceType === "STANDARD"
					? {
							name: "ZATCA Compliance Test Buyer",
							taxNumber: "300000000000003",
							address: { city: "Riyadh", countryCode: "SA" },
						}
					: undefined,
			lineItems: [
				{
					id: "1",
					name: "بند اختبار",
					quantity: 1,
					unitPrice: 100,
					taxCategory: "S",
					taxPercent: 15,
					lineTotal: 100,
				},
			],
			totals: {
				subtotal: 100,
				totalDiscount: 0,
				taxableAmount: 100,
				taxAmount: 15,
				totalWithVat: 115,
				payableAmount: 115,
			},
			previousInvoiceHash: getInitialPIH(),
			invoiceCounter: 0,
		};

		const testXml = buildInvoiceXml(testInvoiceData);
		const testSigned = signInvoice(
			testXml,
			csrResult.privateKey,
			complianceResult.csid,
			csrResult.publicKey,
		);

		const complianceInvoiceResult = await submitComplianceInvoice(
			Buffer.from(testSigned.signedXml).toString("base64"),
			testSigned.invoiceHash,
			testUuid,
			complianceResult.csid,
			complianceResult.secret,
		);

		if (!complianceInvoiceResult.success) {
			// Store compliance CSID so user can retry
			await db.zatcaDevice.upsert({
				where: {
					organizationId_invoiceType: {
						organizationId: input.organizationId,
						invoiceType: input.invoiceType,
					},
				},
				create: {
					organizationId: input.organizationId,
					invoiceType: input.invoiceType,
					status: "COMPLIANCE",
					complianceCsid: complianceResult.csid,
					complianceSecret: encryptSecret(complianceResult.secret),
					csidRequestId: complianceResult.requestId,
					privateKey: encryptSecret(csrResult.privateKey),
					publicKey: csrResult.publicKey,
					lastError: complianceInvoiceResult.errors
						?.map((e) => e.message)
						.join("; "),
				},
				update: {
					status: "COMPLIANCE",
					complianceCsid: complianceResult.csid,
					complianceSecret: encryptSecret(complianceResult.secret),
					csidRequestId: complianceResult.requestId,
					privateKey: encryptSecret(csrResult.privateKey),
					publicKey: csrResult.publicKey,
					lastError: complianceInvoiceResult.errors
						?.map((e) => e.message)
						.join("; "),
				},
			});

			throw new ORPCError("BAD_REQUEST", {
				message: `فاتورة الاختبار رُفضت: ${complianceInvoiceResult.errors?.map((e) => e.message).join(", ") || "خطأ غير معروف"}`,
			});
		}

		// 6. Request Production CSID
		const productionResult = await requestProductionCSID(
			complianceResult.requestId!,
			complianceResult.csid,
			complianceResult.secret,
		);

		const finalStatus = productionResult.success ? "ACTIVE" : "COMPLIANCE";

		// 7. Save device to DB
		const device = await db.zatcaDevice.upsert({
			where: {
				organizationId_invoiceType: {
					organizationId: input.organizationId,
					invoiceType: input.invoiceType,
				},
			},
			create: {
				organizationId: input.organizationId,
				invoiceType: input.invoiceType,
				status: finalStatus,
				csidCertificate: productionResult.csid ?? complianceResult.csid,
				csidSecret: encryptSecret(
					productionResult.secret ?? complianceResult.secret,
				),
				csidRequestId:
					productionResult.requestId ?? complianceResult.requestId,
				complianceCsid: complianceResult.csid,
				complianceSecret: encryptSecret(complianceResult.secret),
				privateKey: encryptSecret(csrResult.privateKey),
				publicKey: csrResult.publicKey,
				onboardedAt: productionResult.success ? new Date() : null,
				lastError: productionResult.success
					? null
					: productionResult.errors?.map((e) => e.message).join("; "),
			},
			update: {
				status: finalStatus,
				csidCertificate: productionResult.csid ?? complianceResult.csid,
				csidSecret: encryptSecret(
					productionResult.secret ?? complianceResult.secret,
				),
				csidRequestId:
					productionResult.requestId ?? complianceResult.requestId,
				complianceCsid: complianceResult.csid,
				complianceSecret: encryptSecret(complianceResult.secret),
				privateKey: encryptSecret(csrResult.privateKey),
				publicKey: csrResult.publicKey,
				onboardedAt: productionResult.success ? new Date() : null,
				lastError: productionResult.success
					? null
					: productionResult.errors?.map((e) => e.message).join("; "),
			},
		});

		// 8. Audit log
		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "SETTINGS_UPDATED",
			entityType: "ZatcaDevice",
			entityId: device.id,
			metadata: {
				action: "zatca_onboarding",
				invoiceType: input.invoiceType,
				status: finalStatus,
			},
		});

		return {
			success: true,
			status: finalStatus,
			deviceId: device.id,
			warnings: complianceInvoiceResult.warnings,
			message:
				finalStatus === "ACTIVE"
					? "تم التسجيل بنجاح مع زاتكا"
					: "تم الحصول على شهادة الاختبار. اطلب شهادة الإنتاج لإكمال التسجيل.",
		};
	});

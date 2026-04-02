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
	SANDBOX_DEFAULTS,
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
					select: { taxNumber: true, commercialReg: true },
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

		// 3. Generate CSR + key pair (wrap in try-catch for clear error messages)
		try {

		const csrResult = await generateCSR({
			organizationName: org.name,
			vatNumber: cleanTaxNumber,
			invoiceType: input.invoiceType === "STANDARD" ? "1000" : "0100",
			location: org.city || "Jeddah",
			industry: "Construction",
		});

		// 4. Request Compliance CSID from ZATCA
		//    Sandbox always requires the fixed OTP "123345" regardless of user input
		const env = process.env.ZATCA_ENVIRONMENT || "simulation";
		const effectiveOtp = env === "sandbox" ? SANDBOX_DEFAULTS.otp : input.otp;
		const complianceResult = await requestComplianceCSID(csrResult.csr, effectiveOtp);

		if (!complianceResult.success || !complianceResult.csid || !complianceResult.secret) {
			throw new ORPCError("BAD_REQUEST", {
				message: `فشل التسجيل مع زاتكا: ${complianceResult.errors?.map((e) => e.message).join(", ") || "خطأ غير معروف"}`,
			});
		}

		// 5. Build and send 6 test invoices for compliance check
		//    Per ZATCA spec: standard invoice, standard debit, standard credit,
		//    simplified invoice, simplified credit, simplified debit
		const complianceTestTypes: Array<{
			typeCode: "388" | "381" | "383";
			simplified: boolean;
			label: string;
			billingRef?: { invoiceNumber: string };
		}> = input.invoiceType === "STANDARD"
			? [
				{ typeCode: "388", simplified: false, label: "Standard Invoice" },
				{ typeCode: "383", simplified: false, label: "Standard Debit Note", billingRef: { invoiceNumber: "TEST-0001" } },
				{ typeCode: "381", simplified: false, label: "Standard Credit Note", billingRef: { invoiceNumber: "TEST-0001" } },
			]
			: [
				{ typeCode: "388", simplified: true, label: "Simplified Invoice" },
				{ typeCode: "381", simplified: true, label: "Simplified Credit Note", billingRef: { invoiceNumber: "TEST-0001" } },
				{ typeCode: "383", simplified: true, label: "Simplified Debit Note", billingRef: { invoiceNumber: "TEST-0001" } },
			];

		let previousHash = getInitialPIH();
		let counter = 0;
		const allComplianceWarnings: Array<{ code?: string; message?: string }> = [];

		for (const testType of complianceTestTypes) {
			const testUuid = uuidv4();
			counter++;

			const testInvoiceData: ZatcaInvoiceData = {
				uuid: testUuid,
				invoiceNumber: `TEST-${String(counter).padStart(4, "0")}`,
				issueDate: new Date().toISOString().split("T")[0]!,
				issueTime: new Date().toISOString().split("T")[1]!.replace(/\.\d+Z/, ""),
				invoiceTypeCode: testType.typeCode,
				isSimplified: testType.simplified,
				deliveryDate: testType.simplified ? undefined : new Date().toISOString().split("T")[0]!,
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
				buyer: !testType.simplified
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
				billingReference: testType.billingRef,
				previousInvoiceHash: previousHash,
				invoiceCounter: counter,
			};

			const testXml = buildInvoiceXml(testInvoiceData);
			const testSigned = signInvoice(
				testXml,
				csrResult.privateKey,
				complianceResult.csid,
				csrResult.publicKey,
			);

			previousHash = testSigned.invoiceHash;

			const complianceInvoiceResult = await submitComplianceInvoice(
				Buffer.from(testSigned.signedXml).toString("base64"),
				testSigned.invoiceHash,
				testUuid,
				complianceResult.csid,
				complianceResult.secret,
			);

			if (complianceInvoiceResult.warnings?.length) {
				allComplianceWarnings.push(...complianceInvoiceResult.warnings);
			}

			if (!complianceInvoiceResult.success) {
				console.error(`[ZATCA] Compliance test failed for ${testType.label}:`, complianceInvoiceResult.errors);

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
						lastError: `${testType.label}: ${complianceInvoiceResult.errors?.map((e) => e.message).join("; ")}`,
					},
					update: {
						status: "COMPLIANCE",
						complianceCsid: complianceResult.csid,
						complianceSecret: encryptSecret(complianceResult.secret),
						csidRequestId: complianceResult.requestId,
						privateKey: encryptSecret(csrResult.privateKey),
						publicKey: csrResult.publicKey,
						lastError: `${testType.label}: ${complianceInvoiceResult.errors?.map((e) => e.message).join("; ")}`,
					},
				});

				throw new ORPCError("BAD_REQUEST", {
					message: `فاتورة اختبار ${testType.label} رُفضت: ${complianceInvoiceResult.errors?.map((e) => e.message).join(", ") || "خطأ غير معروف"}`,
				});
			}
		}

		// All compliance tests passed
		const complianceInvoiceResult = {
			success: true,
			warnings: allComplianceWarnings.length > 0 ? allComplianceWarnings : undefined,
		};

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

		} catch (error) {
			// Re-throw ORPCError as-is (already has proper messages)
			if (error instanceof ORPCError) throw error;

			console.error("[ZATCA Onboarding] Error:", error);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: `خطأ في التسجيل مع زاتكا: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
			});
		}
	});

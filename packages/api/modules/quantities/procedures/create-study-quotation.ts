import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { db, generateQuotationNumber } from "@repo/database";
import { z } from "zod";
import { toNum } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

const displayConfigSchema = z.object({
	grouping: z.enum(["BY_SECTION", "BY_FLOOR", "BY_ITEM", "FLAT"]),
	showItemNumber: z.boolean(),
	showDescription: z.boolean(),
	showSpecifications: z.boolean(),
	showQuantity: z.boolean(),
	showUnit: z.boolean(),
	showUnitPrice: z.boolean(),
	showItemTotal: z.boolean(),
	showStructural: z.boolean(),
	showFinishing: z.boolean(),
	showMEP: z.boolean(),
	showManualItems: z.boolean(),
	showMaterialDetails: z.boolean(),
	showSectionSubtotal: z.boolean(),
	showSubtotal: z.boolean(),
	showDiscount: z.boolean(),
	showVAT: z.boolean(),
	showGrandTotal: z.boolean(),
	showPricePerSqm: z.boolean(),
	totalArea: z.number().optional(),
	pricePerSqm: z.number().optional(),
	lumpSumAmount: z.number().optional(),
	lumpSumDescription: z.string().optional(),
});

export const createStudyQuotation = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/quotation",
		tags: ["Quantities", "Quotation"],
		summary: "Create a quotation from a cost study",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			format: z.enum(["DETAILED_BOQ", "PER_SQM", "LUMP_SUM", "CUSTOM"]),
			displayConfig: displayConfigSchema,
			clientData: z.object({
				name: z.string().min(1),
				company: z.string().optional(),
				phone: z.string().optional(),
				email: z.string().optional(),
				taxNumber: z.string().optional(),
			}),
			validDays: z.number().int().positive().default(30),
			discountType: z.enum(["none", "percent", "amount"]).default("none"),
			discountValue: z.number().optional(),
			paymentTerms: z.string().optional(),
			deliveryTerms: z.string().optional(),
			warrantyTerms: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		// Fetch study with costing and markup data
		const study = await db.costStudy.findFirst({
			where: { id: input.studyId, organizationId: input.organizationId },
			include: {
				costingItems: { orderBy: [{ section: "asc" }, { sortOrder: "asc" }] },
				sectionMarkups: true,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
		}

		// Compute selling prices per item
		const sectionMarkupsMap = new Map(
			study.sectionMarkups.map((sm) => [sm.section, toNum(sm.markupPercent)]),
		);
		const defaultMarkup = toNum(study.profitPercent);
		const overheadPct = toNum(study.overheadPercent);
		const contingencyPct = toNum(study.contingencyPercent);

		// Generate quotation items based on format
		const quotationItems = generateItems(
			input.format,
			study.costingItems.map((item) => ({
				id: item.id,
				section: item.section,
				description: item.description,
				unit: item.unit,
				quantity: toNum(item.quantity),
				totalCost: toNum(item.totalCost),
			})),
			{
				sectionMarkupsMap,
				defaultMarkup,
				overheadPct,
				contingencyPct,
				displayConfig: input.displayConfig,
				buildingArea: input.displayConfig.totalArea ?? toNum(study.buildingArea),
				lumpSumDescription: input.displayConfig.lumpSumDescription,
			},
		);

		// Calculate totals
		let subtotal = 0;
		for (const item of quotationItems) {
			subtotal += item.totalPrice;
		}

		let discountPercent = 0;
		let discountAmount = 0;
		if (input.discountType === "percent" && input.discountValue) {
			discountPercent = input.discountValue;
			discountAmount = subtotal * (discountPercent / 100);
		} else if (input.discountType === "amount" && input.discountValue) {
			discountAmount = input.discountValue;
			discountPercent = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
		}

		const afterDiscount = subtotal - discountAmount;
		const vatPercent = 15;
		const vatAmount = afterDiscount * (vatPercent / 100);
		const totalAmount = afterDiscount + vatAmount;

		const validUntil = new Date();
		validUntil.setDate(validUntil.getDate() + input.validDays);

		// Generate quotation number
		const quotationNo = await generateQuotationNumber(input.organizationId);

		// Create everything in a transaction
		const result = await db.$transaction(async (tx) => {
			// 1. Create Quotation
			const quotation = await tx.quotation.create({
				data: {
					organizationId: input.organizationId,
					createdById: context.user.id,
					quotationNo,
					costStudyId: input.studyId,
					clientName: input.clientData.name,
					clientCompany: input.clientData.company,
					clientPhone: input.clientData.phone,
					clientEmail: input.clientData.email,
					clientTaxNumber: input.clientData.taxNumber,
					status: "DRAFT",
					validUntil,
					subtotal,
					discountPercent,
					discountAmount,
					vatPercent,
					vatAmount,
					totalAmount,
					paymentTerms: input.paymentTerms,
					deliveryTerms: input.deliveryTerms,
					warrantyTerms: input.warrantyTerms,
					notes: input.notes,
					items: {
						create: quotationItems.map((item, idx) => ({
							description: item.description,
							quantity: item.quantity,
							unit: item.unit,
							unitPrice: item.unitPrice,
							totalPrice: item.totalPrice,
							sortOrder: idx,
						})),
					},
				},
			});

			// 2. Create QuotationDisplayConfig
			await tx.quotationDisplayConfig.create({
				data: {
					quotationId: quotation.id,
					format: input.format,
					grouping: input.displayConfig.grouping,
					showItemNumber: input.displayConfig.showItemNumber,
					showDescription: input.displayConfig.showDescription,
					showSpecifications: input.displayConfig.showSpecifications,
					showQuantity: input.displayConfig.showQuantity,
					showUnit: input.displayConfig.showUnit,
					showUnitPrice: input.displayConfig.showUnitPrice,
					showItemTotal: input.displayConfig.showItemTotal,
					showStructural: input.displayConfig.showStructural,
					showFinishing: input.displayConfig.showFinishing,
					showMEP: input.displayConfig.showMEP,
					showManualItems: input.displayConfig.showManualItems,
					showMaterialDetails: input.displayConfig.showMaterialDetails,
					showSectionSubtotal: input.displayConfig.showSectionSubtotal,
					showSubtotal: input.displayConfig.showSubtotal,
					showDiscount: input.displayConfig.showDiscount,
					showVAT: input.displayConfig.showVAT,
					showGrandTotal: input.displayConfig.showGrandTotal,
					showPricePerSqm: input.displayConfig.showPricePerSqm,
					totalArea: input.displayConfig.totalArea,
					pricePerSqm: input.displayConfig.pricePerSqm,
					lumpSumAmount: input.displayConfig.lumpSumAmount,
					lumpSumDescription: input.displayConfig.lumpSumDescription,
				},
			});

			// 3. Update StudyStage QUOTATION → DRAFT
			await tx.studyStage.updateMany({
				where: {
					costStudyId: input.studyId,
					stage: "QUOTATION",
				},
				data: { status: "DRAFT" },
			});

			return quotation;
		});

		return {
			quotationId: result.id,
			quotationNo: result.quotationNo,
		};
	});

// ────────────────────────────────────────────────────────────────
// Item generation logic
// ────────────────────────────────────────────────────────────────

interface CostingItemData {
	id: string;
	section: string;
	description: string;
	unit: string;
	quantity: number;
	totalCost: number;
}

interface GenerateOptions {
	sectionMarkupsMap: Map<string, number>;
	defaultMarkup: number;
	overheadPct: number;
	contingencyPct: number;
	displayConfig: z.infer<typeof displayConfigSchema>;
	buildingArea: number;
	lumpSumDescription?: string;
}

function generateItems(
	format: string,
	items: CostingItemData[],
	opts: GenerateOptions,
): Array<{ description: string; quantity: number; unit: string; unitPrice: number; totalPrice: number }> {
	// Calculate total selling price
	const totalCost = items.reduce((s, i) => s + i.totalCost, 0);
	const overheadAmount = totalCost * (opts.overheadPct / 100);
	const contingencyAmount = totalCost * (opts.contingencyPct / 100);
	const profitAmount = totalCost * (opts.defaultMarkup / 100);
	const sellingPrice = totalCost + overheadAmount + contingencyAmount + profitAmount;

	switch (format) {
		case "LUMP_SUM": {
			return [{
				description: opts.lumpSumDescription || "بناء وتشطيب حسب المواصفات المرفقة",
				quantity: 1,
				unit: "مقطوعية",
				unitPrice: sellingPrice,
				totalPrice: sellingPrice,
			}];
		}

		case "PER_SQM": {
			const area = opts.buildingArea || 1;
			const pricePerSqm = sellingPrice / area;

			// Group by section
			if (opts.displayConfig.grouping === "BY_SECTION") {
				const sectionTotals = new Map<string, number>();
				for (const item of items) {
					sectionTotals.set(item.section, (sectionTotals.get(item.section) ?? 0) + item.totalCost);
				}

				const result: Array<{ description: string; quantity: number; unit: string; unitPrice: number; totalPrice: number }> = [];
				const sectionLabels: Record<string, string> = {
					STRUCTURAL: "الأعمال الإنشائية",
					FINISHING: "أعمال التشطيبات",
					MEP: "الأعمال الكهروميكانيكية",
					LABOR: "أعمال العمالة",
					MANUAL: "بنود إضافية",
				};

				for (const [section, cost] of sectionTotals) {
					const markup = opts.sectionMarkupsMap.get(section) ?? opts.defaultMarkup;
					const sectionSelling = cost * (1 + (opts.overheadPct + opts.contingencyPct + markup) / 100);
					const sectionPricePerSqm = sectionSelling / area;
					result.push({
						description: sectionLabels[section] ?? section,
						quantity: area,
						unit: "م²",
						unitPrice: sectionPricePerSqm,
						totalPrice: sectionSelling,
					});
				}
				return result;
			}

			return [{
				description: "بناء وتشطيب حسب المواصفات المرفقة",
				quantity: area,
				unit: "م²",
				unitPrice: pricePerSqm,
				totalPrice: sellingPrice,
			}];
		}

		case "DETAILED_BOQ":
		case "CUSTOM":
		default: {
			// Filter by enabled sections
			const cfg = opts.displayConfig;
			const filtered = items.filter((item) => {
				if (item.section === "STRUCTURAL" && !cfg.showStructural) return false;
				if (item.section === "FINISHING" && !cfg.showFinishing) return false;
				if (item.section === "MEP" && !cfg.showMEP) return false;
				if (item.section === "MANUAL" && !cfg.showManualItems) return false;
				return true;
			});

			return filtered.map((item) => {
				const markup = opts.sectionMarkupsMap.get(item.section) ?? opts.defaultMarkup;
				const itemSelling = item.totalCost * (1 + (opts.overheadPct + opts.contingencyPct + markup) / 100);
				const unitPrice = item.quantity > 0 ? itemSelling / item.quantity : itemSelling;
				return {
					description: item.description,
					quantity: item.quantity,
					unit: item.unit,
					unitPrice,
					totalPrice: itemSelling,
				};
			});
		}
	}
}

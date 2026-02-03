import { ORPCError } from "@orpc/server";
import { getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getById = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{id}",
		tags: ["Quantities"],
		summary: "Get cost study by ID",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		const costStudy = await getCostStudyById(input.id, input.organizationId);

		if (!costStudy) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		// Convert Decimal to number for JSON serialization
		return {
			...costStudy,
			landArea: Number(costStudy.landArea),
			buildingArea: Number(costStudy.buildingArea),
			structuralCost: Number(costStudy.structuralCost),
			finishingCost: Number(costStudy.finishingCost),
			mepCost: Number(costStudy.mepCost),
			laborCost: Number(costStudy.laborCost),
			overheadPercent: Number(costStudy.overheadPercent),
			profitPercent: Number(costStudy.profitPercent),
			contingencyPercent: Number(costStudy.contingencyPercent),
			totalCost: Number(costStudy.totalCost),
			structuralItems: costStudy.structuralItems.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				concreteVolume: item.concreteVolume ? Number(item.concreteVolume) : null,
				steelWeight: item.steelWeight ? Number(item.steelWeight) : null,
				steelRatio: item.steelRatio ? Number(item.steelRatio) : null,
				wastagePercent: Number(item.wastagePercent),
				materialCost: Number(item.materialCost),
				laborCost: Number(item.laborCost),
				totalCost: Number(item.totalCost),
			})),
			finishingItems: costStudy.finishingItems.map((item) => ({
				...item,
				area: Number(item.area),
				wastagePercent: Number(item.wastagePercent),
				materialPrice: Number(item.materialPrice),
				laborPrice: Number(item.laborPrice),
				materialCost: Number(item.materialCost),
				laborCost: Number(item.laborCost),
				totalCost: Number(item.totalCost),
			})),
			mepItems: costStudy.mepItems.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalCost: Number(item.totalCost),
			})),
			laborItems: costStudy.laborItems.map((item) => ({
				...item,
				dailyRate: Number(item.dailyRate),
				insuranceCost: Number(item.insuranceCost),
				housingCost: Number(item.housingCost),
				otherCosts: Number(item.otherCosts),
				totalCost: Number(item.totalCost),
			})),
			quotes: costStudy.quotes.map((quote) => ({
				...quote,
				subtotal: Number(quote.subtotal),
				overheadAmount: Number(quote.overheadAmount),
				profitAmount: Number(quote.profitAmount),
				vatAmount: Number(quote.vatAmount),
				totalAmount: Number(quote.totalAmount),
			})),
		};
	});

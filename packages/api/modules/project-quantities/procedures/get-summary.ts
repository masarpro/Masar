import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/quantities/summary",
		tags: ["Project Quantities"],
		summary: "Get project quantities summary",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		const studies = await db.costStudy.findMany({
			where: {
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
			include: {
				structuralItems: true,
				finishingItems: true,
				mepItems: true,
				laborItems: true,
			},
		});

		const studySummaries = studies.map((study) => {
			const totalStructural = study.structuralItems.reduce(
				(sum, item) => sum + Number(item.totalCost),
				0,
			);
			const totalFinishing = study.finishingItems.reduce(
				(sum, item) => sum + Number(item.totalCost),
				0,
			);
			const totalMEP = study.mepItems.reduce(
				(sum, item) => sum + Number(item.totalCost),
				0,
			);
			const totalLabor = study.laborItems.reduce(
				(sum, item) => sum + Number(item.totalCost),
				0,
			);
			const subtotal = totalStructural + totalFinishing + totalMEP + totalLabor;

			const overheadPercent = Number(study.overheadPercent);
			const profitPercent = Number(study.profitPercent);
			const contingencyPercent = Number(study.contingencyPercent);
			const vatPercent = study.vatIncluded ? 15 : 0;

			const overhead = subtotal * (overheadPercent / 100);
			const profit = subtotal * (profitPercent / 100);
			const contingency = subtotal * (contingencyPercent / 100);
			const beforeVat = subtotal + overhead + profit + contingency;
			const vat = beforeVat * (vatPercent / 100);
			const grandTotal = beforeVat + vat;

			return {
				id: study.id,
				name: study.name ?? "دراسة بدون اسم",
				totalStructural,
				totalFinishing,
				totalMEP,
				totalLabor,
				subtotal,
				overheadPercent,
				profitPercent,
				vatPercent,
				grandTotal,
			};
		});

		const totals = {
			structural: studySummaries.reduce((s, st) => s + st.totalStructural, 0),
			finishing: studySummaries.reduce((s, st) => s + st.totalFinishing, 0),
			mep: studySummaries.reduce((s, st) => s + st.totalMEP, 0),
			labor: studySummaries.reduce((s, st) => s + st.totalLabor, 0),
			subtotalBeforeMarkup: studySummaries.reduce(
				(s, st) => s + st.subtotal,
				0,
			),
			grandTotal: studySummaries.reduce((s, st) => s + st.grandTotal, 0),
		};

		return {
			studies: studySummaries,
			totals,
			studyCount: studies.length,
		};
	});

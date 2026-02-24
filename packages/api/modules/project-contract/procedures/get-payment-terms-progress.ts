import { getPaymentTermsWithProgress } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getPaymentTermsProgressProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/contract/payment-terms-progress",
		tags: ["Project Contract"],
		summary: "Get payment terms with progress and linked payments",
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
			{ section: "projects", action: "viewFinance" },
		);

		const result = await getPaymentTermsWithProgress(
			input.organizationId,
			input.projectId,
		);

		// Return empty structure if no contract found
		if (!result) {
			return {
				contractId: null,
				contractValue: 0,
				totalWithVat: 0,
				clientName: null,
				currency: "SAR",
				totalPaid: 0,
				totalRequired: 0,
				overallProgress: 0,
				nextIncompleteTermId: null,
				terms: [] as Array<{
					id: string;
					type: string;
					label: string | null;
					percent: number | null;
					amount: number;
					sortOrder: number;
					paidAmount: number;
					remainingAmount: number;
					progressPercent: number;
					isComplete: boolean;
					payments: Array<{
						id: string;
						paymentNo: string;
						amount: number;
						date: Date;
						paymentMethod: string;
						referenceNo: string | null;
						description: string | null;
						destinationAccount: { id: string; name: string } | null;
						createdBy: { id: string; name: string } | null;
					}>;
				}>,
			};
		}

		return result;
	});

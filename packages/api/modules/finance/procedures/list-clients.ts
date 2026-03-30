import { getOrganizationClients } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString, searchQuery, paginationLimit, paginationOffset } from "../../../lib/validation-constants";

// نوع العميل
const clientTypeEnum = z.enum(["INDIVIDUAL", "COMMERCIAL"]);

export const listClients = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/clients",
		tags: ["Finance", "Clients"],
		summary: "List clients for an organization",
	})
	.input(
		z.object({
			organizationId: idString(),
			query: searchQuery(),
			isActive: z.boolean().optional(),
			clientType: clientTypeEnum.optional(),
			classification: z.string().trim().max(200).optional(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const result = await getOrganizationClients(input.organizationId, {
			query: input.query,
			isActive: input.isActive,
			clientType: input.clientType,
			classification: input.classification,
			limit: input.limit,
			offset: input.offset,
		});

		return result;
	});

import { ORPCError } from "@orpc/client";
import { getOrganizationById as getOrganizationByIdFn } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";
import { idString } from "../../../lib/validation-constants";

export const findOrganization = adminProcedure
	.route({
		method: "GET",
		path: "/admin/organizations/{id}",
		tags: ["Administration"],
		summary: "Find organization by ID",
	})
	.input(
		z.object({
			id: idString(),
		}),
	)
	.handler(async ({ input: { id } }) => {
		const organization = await getOrganizationByIdFn(id);

		if (!organization) {
			throw new ORPCError("NOT_FOUND");
		}

		return organization;
	});

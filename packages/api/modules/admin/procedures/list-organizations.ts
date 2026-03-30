import { ORPCError } from "@orpc/client";
import {
	countAllOrganizations,
	getOrganizationById as getOrganizationByIdFn,
	getOrganizations,
} from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";
import { searchQuery, idString, paginationLimit, paginationOffset } from "../../../lib/validation-constants";

export const listOrganizations = adminProcedure
	.route({
		method: "GET",
		path: "/admin/organizations",
		tags: ["Administration"],
		summary: "List organizations",
	})
	.input(
		z.object({
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input: { query, limit, offset } }) => {
		const organizations = await getOrganizations({
			limit,
			offset,
			query,
		});

		const total = await countAllOrganizations({ query });

		return { organizations, total };
	});

export const getOrganizationById = adminProcedure
	.route({
		method: "GET",
		path: "/admin/organizations/{id}",
		tags: ["Administration"],
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

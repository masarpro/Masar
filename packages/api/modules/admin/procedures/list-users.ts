import { countAllUsers, getUsers } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";
import { searchQuery, paginationLimit, paginationOffset } from "../../../lib/validation-constants";

export const listUsers = adminProcedure
	.route({
		method: "GET",
		path: "/admin/users",
		tags: ["Administration"],
		summary: "List users",
	})
	.input(
		z.object({
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input: { query, limit, offset } }) => {
		const users = await getUsers({
			limit,
			offset,
			query,
		});

		const total = await countAllUsers({ query });

		return { users, total };
	});

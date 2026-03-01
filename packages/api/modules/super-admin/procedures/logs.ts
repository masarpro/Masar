import { countSuperAdminLogs, getSuperAdminLogs } from "@repo/database";
import { adminProcedure } from "../../../orpc/procedures";
import { listLogsInput } from "../schema";

export const listLogs = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/logs",
		tags: ["Super Admin"],
		summary: "List super admin logs",
	})
	.input(listLogsInput)
	.handler(async ({ input }) => {
		const [logs, total] = await Promise.all([
			getSuperAdminLogs(input),
			countSuperAdminLogs(input),
		]);
		return { logs, total };
	});

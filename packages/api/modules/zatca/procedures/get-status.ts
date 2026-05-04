// ZATCA Integration Status — حالة الربط مع زاتكا

import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const getZatcaStatus = protectedProcedure
	.route({
		method: "GET",
		path: "/zatca/status",
		tags: ["ZATCA"],
		summary: "Get ZATCA integration status for organization",
	})
	.input(
		z.object({
			organizationId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "integrations",
		});

		// Get all ZATCA devices for this org
		const devices = await db.zatcaDevice.findMany({
			where: { organizationId: input.organizationId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				deviceName: true,
				invoiceType: true,
				status: true,
				onboardedAt: true,
				csidExpiresAt: true,
				lastError: true,
				invoiceCounter: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		// Determine phase
		const hasActiveDevice = devices.some((d) => d.status === "ACTIVE");
		const hasAnyDevice = devices.some((d) => d.status !== "DISABLED");
		const phase = hasActiveDevice ? ("2" as const) : ("1" as const);

		// Compute submission stats
		const stats = hasAnyDevice
			? await db.zatcaSubmission.groupBy({
					by: ["status"],
					where: { organizationId: input.organizationId },
					_count: { id: true },
				})
			: [];

		const statMap: Record<string, number> = {};
		for (const s of stats) {
			statMap[s.status] = s._count.id;
		}

		const environment = (process.env.ZATCA_ENVIRONMENT || "simulation") as
			| "sandbox"
			| "simulation"
			| "production";

		return {
			phase,
			environment,
			devices,
			stats: {
				total: Object.values(statMap).reduce((a, b) => a + b, 0),
				cleared: statMap.CLEARED ?? 0,
				reported: statMap.REPORTED ?? 0,
				rejected: statMap.REJECTED ?? 0,
				pending: statMap.PENDING ?? 0,
				failed: statMap.FAILED ?? 0,
			},
		};
	});

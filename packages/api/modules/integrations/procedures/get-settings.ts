import { getIntegrationSettings, getMessageDeliveryLogs } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { getProvidersStatus } from "../../../lib/messaging/send";

export const getSettings = protectedProcedure
	.route({
		method: "GET",
		path: "/integrations/settings",
		tags: ["Integrations"],
		summary: "Get organization integration settings",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "integrations" },
		);

		const settings = await getIntegrationSettings(input.organizationId);
		const providersStatus = getProvidersStatus();

		return {
			settings,
			providersStatus,
		};
	});

export const getDeliveryLogs = protectedProcedure
	.route({
		method: "GET",
		path: "/integrations/logs",
		tags: ["Integrations"],
		summary: "Get message delivery logs",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			channel: z.enum(["EMAIL", "WHATSAPP", "SMS"]).optional(),
			status: z.enum(["PENDING", "SENT", "FAILED", "SKIPPED"]).optional(),
			limit: z.number().min(1).max(100).optional().default(50),
			offset: z.number().min(0).optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "integrations" },
		);

		const result = await getMessageDeliveryLogs(input.organizationId, {
			projectId: input.projectId,
			channel: input.channel,
			status: input.status,
			limit: input.limit,
			offset: input.offset,
		});

		return result;
	});

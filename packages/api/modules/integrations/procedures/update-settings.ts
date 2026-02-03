import { ORPCError } from "@orpc/server";
import { updateIntegrationSettings } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { isChannelConfigured } from "../../../lib/messaging/send";

export const updateSettings = protectedProcedure
	.route({
		method: "POST",
		path: "/integrations/settings",
		tags: ["Integrations"],
		summary: "Update organization integration settings",
	})
	.input(
		z.object({
			organizationId: z.string(),
			emailEnabled: z.boolean().optional(),
			whatsappEnabled: z.boolean().optional(),
			smsEnabled: z.boolean().optional(),
			defaultChannel: z.enum(["EMAIL", "WHATSAPP", "SMS"]).optional(),
			ownerNotifyOnOfficialUpdate: z.boolean().optional(),
			ownerNotifyOnPaymentDue: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "integrations" },
		);

		// Validate that enabled channels are configured
		if (input.whatsappEnabled && !isChannelConfigured("WHATSAPP")) {
			throw new ORPCError("BAD_REQUEST", {
				message: "WhatsApp provider is not configured",
			});
		}

		if (input.smsEnabled && !isChannelConfigured("SMS")) {
			throw new ORPCError("BAD_REQUEST", {
				message: "SMS provider is not configured",
			});
		}

		const { organizationId, ...updateData } = input;

		const settings = await updateIntegrationSettings(
			organizationId,
			updateData,
		);

		return { settings };
	});

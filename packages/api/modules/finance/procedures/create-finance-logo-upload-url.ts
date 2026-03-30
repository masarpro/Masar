import { ORPCError } from "@orpc/server";
import { config } from "@repo/config";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const createFinanceLogoUploadUrl = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/settings/logo-upload-url",
		tags: ["Finance", "Settings"],
		summary: "Create finance logo upload URL",
		description:
			"Create a signed upload URL to upload a company logo for finance documents",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ context: { user }, input: { organizationId } }) => {
		const membership = await verifyOrganizationMembership(
			organizationId,
			user.id,
		);

		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		const path = `finance-logo-${organizationId}.png`;
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: config.storage.bucketNames.avatars,
		});

		return { signedUploadUrl, path };
	});

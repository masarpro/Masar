import { z } from "zod";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const inviteTeamMembers = protectedProcedure
	.route({
		method: "POST",
		path: "/onboarding/invite-team",
		tags: ["Onboarding"],
		summary: "Invite team members during onboarding",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			invitations: z
				.array(
					z.object({
						email: z.string().trim().email().max(254),
						role: z.enum(["admin", "member"]).default("member"),
					}),
				)
				.min(1)
				.max(5),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		const { organizationId, invitations } = input;

		const results: Array<{
			email: string;
			status: "sent" | "failed";
			error?: string;
		}> = [];

		for (const invite of invitations) {
			try {
				await auth.api.createInvitation({
					body: {
						organizationId,
						email: invite.email,
						role: invite.role,
					},
					headers: context.headers,
				});
				results.push({ email: invite.email, status: "sent" });
			} catch (error) {
				results.push({
					email: invite.email,
					status: "failed",
					error: String(error),
				});
			}
		}

		const successCount = results.filter((r) => r.status === "sent").length;
		if (successCount > 0) {
			await db.onboardingProgress.upsert({
				where: { organizationId },
				update: { teamInviteDone: true },
				create: { organizationId, teamInviteDone: true },
			});
		}

		return { results, successCount };
	});

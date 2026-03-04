import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";
import { ORPCError } from "@orpc/server";

export const getOrganizationPlan = protectedProcedure
	.route({
		method: "GET",
		path: "/organizations/{organizationId}/plan",
		tags: ["Organizations"],
		summary: "Get organization plan and usage limits",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);

		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		const org = await db.organization.findUnique({
			where: { id: input.organizationId },
			select: {
				plan: true,
				status: true,
				trialEndsAt: true,
				isFreeOverride: true,
				_count: {
					select: {
						projects: { where: { status: { not: "ARCHIVED" } } },
						members: true,
					},
				},
			},
		});

		if (!org) {
			throw new ORPCError("NOT_FOUND");
		}

		const aiChatUsage = await db.aiChatUsage.findUnique({
			where: { organizationId: input.organizationId },
		});

		const now = new Date();
		const trialDaysRemaining =
			org.status === "TRIALING" && org.trialEndsAt
				? Math.max(
						0,
						Math.ceil(
							(org.trialEndsAt.getTime() - now.getTime()) /
								(1000 * 60 * 60 * 24),
						),
					)
				: 0;

		// Determine effective plan
		let effectivePlan: "PRO" | "FREE" | "TRIAL" = "FREE";
		if (org.isFreeOverride) {
			effectivePlan = "PRO";
		} else if (
			org.plan === "PRO" &&
			(org.status === "ACTIVE" || org.status === "TRIALING")
		) {
			effectivePlan = "PRO";
		} else if (
			org.status === "TRIALING" &&
			org.trialEndsAt &&
			now < org.trialEndsAt
		) {
			effectivePlan = "TRIAL";
		}

		const isFree = effectivePlan === "FREE";

		return {
			plan: org.plan,
			status: org.status,
			trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
			trialDaysRemaining,
			effectivePlan,
			limits: {
				projects: {
					used: org._count.projects,
					max: isFree ? 1 : 100,
				},
				members: {
					used: org._count.members,
					max: isFree ? 2 : 50,
				},
				aiChats: {
					used: aiChatUsage?.totalChats ?? 0,
					max: isFree ? 10 : -1, // -1 means unlimited
				},
			},
		};
	});

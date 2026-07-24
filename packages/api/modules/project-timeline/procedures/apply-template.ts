import { applyMilestoneTemplate } from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

/**
 * تطبيق نموذج مراحل جاهز (مراحل + أنشطتها) بطلب واحد ذري.
 * كان التطبيق السابق يرسل ~33 طلب كتابة من العميل فيصطدم بحد الكتابة
 * (20/دقيقة) ويتوقف في المنتصف بصمت، والنقر المزدوج كان يكرر المراحل.
 */
export const applyMilestoneTemplateProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-timeline/milestones/apply-template",
		tags: ["Project Timeline"],
		summary: "Apply a milestone template atomically",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			milestones: z
				.array(
					z.object({
						title: z.string().trim().min(1).max(200),
						activities: z
							.array(z.string().trim().min(1).max(200))
							.max(60)
							.default([]),
					}),
				)
				.min(1)
				.max(30),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			return await applyMilestoneTemplate(
				input.organizationId,
				input.projectId,
				input.milestones,
			);
		} catch (e) {
			const msg = e instanceof Error ? e.message : "تعذّر تطبيق النموذج";
			throw new ORPCError("BAD_REQUEST", { message: msg });
		}
	});

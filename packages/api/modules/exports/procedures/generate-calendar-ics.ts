import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { generateICS, generateEventUID, type ICSEvent } from "../lib/ics-generator";

export const generateCalendarICSProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/exports/calendar-ics",
		tags: ["Exports"],
		summary: "Generate ICS calendar for project milestones and payments",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			includePayments: z.boolean().optional().default(true),
			includeMilestones: z.boolean().optional().default(true),
			includeClaims: z.boolean().optional().default(true),
			language: z.enum(["ar", "en"]).optional().default("ar"),
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

		// Get project
		const project = await db.project.findFirst({
			where: {
				id: input.projectId,
				organizationId: input.organizationId,
			},
			include: {
				organization: true,
			},
		});

		if (!project) {
			throw new ORPCError("NOT_FOUND", { message: "Project not found" });
		}

		const events: ICSEvent[] = [];
		const isArabic = input.language === "ar";

		// Add milestones
		if (input.includeMilestones) {
			const milestones = await db.projectMilestone.findMany({
				where: { projectId: input.projectId },
				orderBy: { targetDate: "asc" },
			});

			for (const milestone of milestones) {
				events.push({
					uid: generateEventUID(
						"milestone",
						milestone.id,
						input.organizationId,
					),
					summary: `${isArabic ? "مرحلة: " : "Milestone: "}${milestone.title}`,
					description: milestone.description || undefined,
					dtstart: milestone.targetDate,
					allDay: true,
					categories: [isArabic ? "مراحل المشروع" : "Project Milestones"],
					status: milestone.status === "COMPLETED" ? "CONFIRMED" : "TENTATIVE",
					priority: 5,
				});
			}
		}

		// Add claims (payment due dates)
		if (input.includeClaims) {
			const claims = await db.projectClaim.findMany({
				where: {
					projectId: input.projectId,
					dueDate: { not: null },
				},
				orderBy: { dueDate: "asc" },
			});

			for (const claim of claims) {
				if (claim.dueDate) {
					events.push({
						uid: generateEventUID("claim", claim.id, input.organizationId),
						summary: `${isArabic ? "مستخلص #" : "Claim #"}${claim.claimNumber}${isArabic ? " - موعد الاستحقاق" : " - Due Date"}`,
						description: isArabic
							? `المبلغ: ${claim.amount.toNumber()} ر.س\nالحالة: ${claim.status}`
							: `Amount: ${claim.amount.toNumber()} SAR\nStatus: ${claim.status}`,
						dtstart: claim.dueDate,
						allDay: true,
						categories: [isArabic ? "مستخلصات" : "Claims"],
						status:
							claim.status === "PAID"
								? "CONFIRMED"
								: claim.status === "REJECTED"
									? "CANCELLED"
									: "TENTATIVE",
						priority: claim.status === "PAID" ? 9 : 1,
					});
				}
			}
		}

		// Add payment schedule entries
		if (input.includePayments) {
			const paymentSchedules = await db.paymentSchedule.findMany({
				where: { projectId: input.projectId },
				orderBy: { dueDate: "asc" },
			});

			for (const schedule of paymentSchedules) {
				events.push({
					uid: generateEventUID("payment", schedule.id, input.organizationId),
					summary: `${isArabic ? "دفعة: " : "Payment: "}${schedule.description}`,
					description: isArabic
						? `المبلغ: ${schedule.amount.toNumber()} ر.س\nالنسبة: ${schedule.percentage}%`
						: `Amount: ${schedule.amount.toNumber()} SAR\nPercentage: ${schedule.percentage}%`,
					dtstart: schedule.dueDate,
					allDay: true,
					categories: [isArabic ? "الدفعات" : "Payments"],
					status: schedule.isPaid ? "CONFIRMED" : "TENTATIVE",
					priority: schedule.isPaid ? 9 : 3,
				});
			}
		}

		// Generate ICS
		const icsContent = generateICS({
			name: isArabic
				? `${project.name} - التقويم`
				: `${project.name} - Calendar`,
			description: isArabic
				? `تقويم المراحل والدفعات للمشروع ${project.name}`
				: `Milestones and payments calendar for project ${project.name}`,
			timezone: "Asia/Riyadh",
			events,
		});

		return {
			filename: `${project.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "-")}-calendar.ics`,
			mimeType: "text/calendar",
			content: Buffer.from(icsContent, "utf-8").toString("base64"),
			eventCount: events.length,
		};
	});

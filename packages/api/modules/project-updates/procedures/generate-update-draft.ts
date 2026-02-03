import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const generateUpdateDraft = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/:projectId/updates/draft",
		tags: ["Project Updates"],
		summary: "Generate an official update draft from project data",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Get project
		const project = await db.project.findFirst({
			where: { id: input.projectId, organizationId: input.organizationId },
			select: {
				id: true,
				name: true,
				clientName: true,
				progress: true,
				contractValue: true,
				endDate: true,
			},
		});

		if (!project) {
			throw new ORPCError("NOT_FOUND", { message: "المشروع غير موجود" });
		}

		// Get latest progress update
		const latestProgress = await db.projectProgressUpdate.findFirst({
			where: { projectId: input.projectId },
			orderBy: { createdAt: "desc" },
			select: {
				progress: true,
				phaseLabel: true,
				note: true,
				createdAt: true,
			},
		});

		// Get latest daily report
		const latestReport = await db.projectDailyReport.findFirst({
			where: { projectId: input.projectId },
			orderBy: { reportDate: "desc" },
			select: {
				workDone: true,
				blockers: true,
				reportDate: true,
			},
		});

		// Get last 4 photos
		const recentPhotos = await db.projectPhoto.findMany({
			where: { projectId: input.projectId },
			orderBy: { createdAt: "desc" },
			take: 4,
			select: {
				id: true,
				url: true,
				caption: true,
				category: true,
			},
		});

		// Get next upcoming payment
		const nextPayment = await db.projectClaim.findFirst({
			where: {
				projectId: input.projectId,
				status: { in: ["APPROVED", "SUBMITTED"] },
				dueDate: { gte: new Date() },
			},
			orderBy: { dueDate: "asc" },
			select: {
				id: true,
				claimNo: true,
				amount: true,
				dueDate: true,
			},
		});

		// Generate draft
		const progress = latestProgress?.progress ?? project.progress;
		const phaseLabel = latestProgress?.phaseLabel ?? "غير محدد";
		const workDoneSummary = latestReport?.workDone ?? "لا يوجد تقرير حديث";
		const blockers = latestReport?.blockers;

		// Generate headline
		let headline = `تحديث مشروع ${project.name}`;
		if (progress >= 100) {
			headline = `تم اكتمال مشروع ${project.name}`;
		} else if (progress >= 75) {
			headline = `مشروع ${project.name} - المراحل النهائية`;
		} else if (progress >= 50) {
			headline = `مشروع ${project.name} - تجاوز منتصف الطريق`;
		}

		// Generate next steps
		let nextSteps = "الاستمرار في العمل حسب الخطة";
		if (blockers) {
			nextSteps = `معالجة العوائق الحالية والاستمرار في التنفيذ`;
		}

		return {
			draft: {
				headline,
				progress: Math.round(progress),
				phaseLabel,
				workDoneSummary,
				blockers: blockers || null,
				nextSteps,
				nextPayment: nextPayment
					? {
							claimNo: nextPayment.claimNo,
							amount: Number(nextPayment.amount),
							dueDate: nextPayment.dueDate,
						}
					: null,
				photoIds: recentPhotos.map((p) => p.id),
				photos: recentPhotos,
			},
			project: {
				id: project.id,
				name: project.name,
				clientName: project.clientName,
				endDate: project.endDate,
			},
			lastReportDate: latestReport?.reportDate,
			lastProgressUpdate: latestProgress?.createdAt,
		};
	});

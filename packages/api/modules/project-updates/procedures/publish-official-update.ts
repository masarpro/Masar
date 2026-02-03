import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const publishOfficialUpdate = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/:projectId/updates/publish",
		tags: ["Project Updates"],
		summary: "Publish an official update to the owner channel",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			headline: z.string().min(1, "العنوان مطلوب"),
			progress: z.number().min(0).max(100),
			phaseLabel: z.string().optional(),
			workDoneSummary: z.string().optional(),
			blockers: z.string().optional(),
			nextSteps: z.string().optional(),
			nextPayment: z
				.object({
					claimNo: z.number(),
					amount: z.number(),
					dueDate: z.coerce.date().nullable(),
				})
				.nullable()
				.optional(),
			photoIds: z.array(z.string()).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Verify project
		const project = await db.project.findFirst({
			where: { id: input.projectId, organizationId: input.organizationId },
			select: { id: true, name: true, clientName: true },
		});

		if (!project) {
			throw new ORPCError("NOT_FOUND", { message: "المشروع غير موجود" });
		}

		// Build update content
		const contentParts: string[] = [];
		contentParts.push(`📢 ${input.headline}`);
		contentParts.push("");
		contentParts.push(`📊 نسبة الإنجاز: ${input.progress}%`);

		if (input.phaseLabel) {
			contentParts.push(`📍 المرحلة الحالية: ${input.phaseLabel}`);
		}

		if (input.workDoneSummary) {
			contentParts.push("");
			contentParts.push(`✅ ما تم إنجازه:`);
			contentParts.push(input.workDoneSummary);
		}

		if (input.blockers) {
			contentParts.push("");
			contentParts.push(`⚠️ العوائق:`);
			contentParts.push(input.blockers);
		}

		if (input.nextSteps) {
			contentParts.push("");
			contentParts.push(`➡️ الخطوات القادمة:`);
			contentParts.push(input.nextSteps);
		}

		if (input.nextPayment) {
			contentParts.push("");
			contentParts.push(`💰 الدفعة القادمة:`);
			contentParts.push(
				`المستخلص رقم ${input.nextPayment.claimNo} - ${input.nextPayment.amount.toLocaleString()} ر.س`,
			);
			if (input.nextPayment.dueDate) {
				contentParts.push(
					`تاريخ الاستحقاق: ${input.nextPayment.dueDate.toLocaleDateString("ar-SA")}`,
				);
			}
		}

		const content = contentParts.join("\n");

		// Create the official update message
		const message = await db.projectMessage.create({
			data: {
				organizationId: input.organizationId,
				projectId: input.projectId,
				channel: "OWNER",
				senderId: context.user.id,
				content,
				isUpdate: true,
				metadata: {
					type: "OFFICIAL_UPDATE",
					headline: input.headline,
					progress: input.progress,
					phaseLabel: input.phaseLabel,
					photoIds: input.photoIds,
					nextPayment: input.nextPayment,
				},
			},
			include: {
				sender: { select: { id: true, name: true } },
			},
		});

		// Create notifications for users with owner portal access
		const ownerAccesses = await db.projectOwnerAccess.findMany({
			where: {
				projectId: input.projectId,
				isRevoked: false,
				OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
			},
		});

		// Log audit event
		await db.projectAuditLog.create({
			data: {
				organizationId: input.organizationId,
				projectId: input.projectId,
				actorId: context.user.id,
				action: "MESSAGE_SENT",
				entityType: "message",
				entityId: message.id,
				metadata: {
					isOfficialUpdate: true,
					headline: input.headline,
				},
			},
		});

		return {
			success: true,
			message,
			notifiedOwners: ownerAccesses.length,
		};
	});

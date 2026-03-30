import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const publishOfficialUpdate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/:projectId/updates/publish",
		tags: ["Project Updates"],
		summary: "Publish an official update to the owner channel",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			headline: z.string().trim().min(1, "العنوان مطلوب").max(200),
			progress: z.number().min(0).max(100),
			phaseLabel: z.string().trim().max(100).optional(),
			workDoneSummary: z.string().trim().max(100).optional(),
			blockers: z.string().trim().max(100).optional(),
			nextSteps: z.string().trim().max(100).optional(),
			nextPayment: z
				.object({
					claimNo: z.number().int().nonnegative().max(999999),
					amount: z.number().nonnegative().max(999999999.99),
					dueDate: z.coerce.date().nullable(),
				})
				.nullable()
				.optional(),
			photoIds: z.array(z.string().trim().max(100)).max(1000).optional(),
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
				`المستخلص رقم ${input.nextPayment.claimNo} - ${input.nextPayment.amount.toLocaleString("en-US")} ر.س`,
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

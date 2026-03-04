import { ORPCError } from "@orpc/client";
import { db } from "@repo/database";
import crypto from "node:crypto";
import { adminProcedure } from "../../../orpc/procedures";
import {
	codeIdInput,
	createActivationCodeInput,
	listActivationCodesInput,
} from "../schema";

function generateCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude O/0/I/1 for readability
	const segments: string[] = [];
	for (let s = 0; s < 3; s++) {
		let seg = "";
		const bytes = crypto.randomBytes(4);
		for (let i = 0; i < 4; i++) {
			seg += chars[bytes[i] % chars.length];
		}
		segments.push(seg);
	}
	return `MASAR-${segments.join("-")}`;
}

export const list = adminProcedure
	.route({
		method: "GET",
		path: "/activation-codes",
		tags: ["Activation Codes"],
		summary: "List all activation codes",
	})
	.input(listActivationCodesInput)
	.handler(async ({ input }) => {
		const [codes, total] = await Promise.all([
			db.activationCode.findMany({
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
				include: {
					createdBy: { select: { id: true, name: true, email: true } },
					_count: { select: { usages: true } },
				},
			}),
			db.activationCode.count(),
		]);

		return { codes, total };
	});

export const create = adminProcedure
	.route({
		method: "POST",
		path: "/activation-codes",
		tags: ["Activation Codes"],
		summary: "Create a new activation code",
	})
	.input(createActivationCodeInput)
	.handler(async ({ input, context }) => {
		const code = generateCode();

		const activationCode = await db.activationCode.create({
			data: {
				code,
				description: input.description,
				durationDays: input.durationDays,
				maxUses: input.maxUses,
				maxUsers: input.maxUsers,
				maxProjects: input.maxProjects,
				maxStorageGB: input.maxStorageGB,
				expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
				createdById: context.user.id,
			},
		});

		return activationCode;
	});

export const deactivate = adminProcedure
	.route({
		method: "POST",
		path: "/activation-codes/deactivate",
		tags: ["Activation Codes"],
		summary: "Deactivate an activation code",
	})
	.input(codeIdInput)
	.handler(async ({ input }) => {
		const existing = await db.activationCode.findUnique({
			where: { id: input.id },
		});

		if (!existing) throw new ORPCError("NOT_FOUND");

		return db.activationCode.update({
			where: { id: input.id },
			data: { isActive: false },
		});
	});

export const getUsages = adminProcedure
	.route({
		method: "GET",
		path: "/activation-codes/usages",
		tags: ["Activation Codes"],
		summary: "Get usages for a specific activation code",
	})
	.input(codeIdInput)
	.handler(async ({ input }) => {
		const code = await db.activationCode.findUnique({
			where: { id: input.id },
			include: {
				usages: {
					include: {
						organization: { select: { id: true, name: true, slug: true } },
						activatedBy: { select: { id: true, name: true, email: true } },
					},
					orderBy: { activatedAt: "desc" },
				},
			},
		});

		if (!code) throw new ORPCError("NOT_FOUND");

		return code;
	});

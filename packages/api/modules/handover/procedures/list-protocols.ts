// Handover Protocols — List & Get by ID

import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { ORPCError } from "@orpc/server";
import { Prisma } from "@repo/database/prisma/generated/client";
import {
	idString,
	searchQuery,
	paginationLimit,
	paginationOffset,
} from "../../../lib/validation-constants";
import { handoverTypeEnum, handoverStatusEnum } from "./shared";

// ═══════════════════════════════════════════════════════════════════════════
// 1. LIST HANDOVER PROTOCOLS
// ═══════════════════════════════════════════════════════════════════════════
export const listHandoverProtocols = protectedProcedure
	.route({
		method: "GET",
		path: "/handover/protocols",
		tags: ["Handover"],
		summary: "List handover protocols",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString().optional(),
			type: handoverTypeEnum.optional(),
			status: handoverStatusEnum.optional(),
			subcontractContractId: idString().optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			search: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "view",
		});

		const where: Prisma.HandoverProtocolWhereInput = { organizationId: input.organizationId };
		if (input.projectId) where.projectId = input.projectId;
		if (input.type) where.type = input.type;
		if (input.status) where.status = input.status;
		if (input.subcontractContractId) where.subcontractContractId = input.subcontractContractId;
		if (input.dateFrom || input.dateTo) {
			where.date = {};
			if (input.dateFrom) where.date.gte = input.dateFrom;
			if (input.dateTo) where.date.lte = input.dateTo;
		}
		if (input.search) {
			where.OR = [
				{ protocolNo: { contains: input.search, mode: "insensitive" } },
				{ title: { contains: input.search, mode: "insensitive" } },
				{ description: { contains: input.search, mode: "insensitive" } },
			];
		}

		const [items, total] = await Promise.all([
			db.handoverProtocol.findMany({
				where,
				include: {
					project: { select: { id: true, name: true } },
					subcontractContract: { select: { id: true, name: true } },
					createdBy: { select: { id: true, name: true } },
					_count: { select: { items: true } },
				},
				orderBy: { date: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.handoverProtocol.count({ where }),
		]);

		return { items, total };
	});

// ═══════════════════════════════════════════════════════════════════════════
// 2. GET HANDOVER PROTOCOL BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getHandoverProtocol = protectedProcedure
	.route({
		method: "GET",
		path: "/handover/protocols/{id}",
		tags: ["Handover"],
		summary: "Get a single handover protocol",
	})
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "projects",
			action: "view",
		});

		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			include: {
				project: { select: { id: true, name: true } },
				subcontractContract: { select: { id: true, name: true } },
				items: { orderBy: { sortOrder: "asc" } },
				createdBy: { select: { id: true, name: true, image: true } },
			},
		});

		if (!protocol) {
			throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		}

		return protocol;
	});

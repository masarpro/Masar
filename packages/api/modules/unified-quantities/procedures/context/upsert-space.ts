import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { upsertSpaceSchema } from "../../schemas/context.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";
import { num } from "../../compute/types";
import {
	shoelaceArea,
	polygonPerimeter,
	validatePolygon,
} from "../../compute/helpers/polygon-helper";

/**
 * يحسب المساحات المُشتقّة (computedFloorArea, computedWallArea):
 * - لو polygonPoints صحيحة → Shoelace + perimeter
 * - وإلا length × width للـ floor، perimeter × height للـ wall
 */
function deriveAreas(input: ReturnType<typeof upsertSpaceSchema.parse>): {
	computedFloorArea: number | null;
	computedWallArea: number | null;
} {
	if (validatePolygon(input.polygonPoints)) {
		const floor = shoelaceArea(input.polygonPoints);
		const peri = polygonPerimeter(input.polygonPoints);
		const wall = num(input.height, 0) > 0 ? peri * num(input.height, 0) : 0;
		return { computedFloorArea: floor, computedWallArea: wall };
	}

	const length = num(input.length, 0);
	const width = num(input.width, 0);
	const height = num(input.height, 0);
	const explicitFloor = num(input.floorArea, NaN);
	const explicitPeri = num(input.wallPerimeter, NaN);

	const floor = Number.isFinite(explicitFloor) ? explicitFloor : length * width;
	const perimeter = Number.isFinite(explicitPeri)
		? explicitPeri
		: 2 * (length + width);
	const wall = height > 0 ? perimeter * height : 0;

	return {
		computedFloorArea: floor || null,
		computedWallArea: wall || null,
	};
}

export const upsertSpace = subscriptionProcedure
	.input(upsertSpaceSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		await loadStudy(input.costStudyId, input.organizationId);

		// Context يجب أن يكون موجوداً (نُنشئ stub لو لزم)
		const ctx = await db.quantityItemContext.upsert({
			where: { costStudyId: input.costStudyId },
			create: {
				costStudyId: input.costStudyId,
				organizationId: input.organizationId,
			},
			update: {},
		});

		const derived = deriveAreas(input);

		const data = {
			contextId: ctx.id,
			organizationId: input.organizationId,
			name: input.name,
			spaceType: input.spaceType,
			floorLabel: input.floorLabel ?? null,
			length: input.length ?? undefined,
			width: input.width ?? undefined,
			height: input.height ?? undefined,
			floorArea: input.floorArea ?? undefined,
			wallPerimeter: input.wallPerimeter ?? undefined,
			...(input.polygonPoints !== null && input.polygonPoints !== undefined
				? { polygonPoints: input.polygonPoints }
				: {}),
			computedFloorArea: derived.computedFloorArea ?? undefined,
			computedWallArea: derived.computedWallArea ?? undefined,
			isWetArea: input.isWetArea,
			isExterior: input.isExterior,
			sortOrder: input.sortOrder,
		};

		let space;
		if (input.id) {
			const existing = await db.quantityContextSpace.findFirst({
				where: { id: input.id, organizationId: input.organizationId },
			});
			if (!existing) {
				throw new ORPCError("NOT_FOUND", { message: "المساحة غير موجودة" });
			}
			space = await db.quantityContextSpace.update({
				where: { id: input.id },
				data,
			});
		} else {
			space = await db.quantityContextSpace.create({ data });
		}

		return { space };
	});

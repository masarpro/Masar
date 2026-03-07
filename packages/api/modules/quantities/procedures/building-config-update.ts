import { ORPCError } from "@orpc/server";
import {
	updateBuildingConfig,
	getCostStudyById,
	getFinishingItemsForCascade,
	batchUpdateFinishingItems,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

// ── Inline derivation logic (mirrors finishing-links.ts on frontend) ──

interface BuildingConfigData {
	totalLandArea: number;
	buildingPerimeter: number;
	floors: Array<{
		id: string;
		area: number;
		height: number;
		isRepeated: boolean;
		repeatCount: number;
		floorType: string;
	}>;
}

interface LinkedSourceData {
	type: string;
	derivation: string;
	floorId?: string;
}

function computeDerived(
	derivation: string,
	config: BuildingConfigData,
	floorId?: string,
): number | null {
	switch (derivation) {
		case "floor_area": {
			if (!floorId) return null;
			const floor = config.floors.find((f) => f.id === floorId);
			return floor?.area ?? null;
		}
		case "wall_area": {
			if (!floorId) return null;
			const floor = config.floors.find((f) => f.id === floorId);
			if (!floor?.area || !floor.height) return null;
			const side = Math.sqrt(floor.area);
			return Math.round(side * 4 * floor.height + floor.area);
		}
		case "external_wall_area":
		case "thermal_wall_area": {
			if (!config.buildingPerimeter) return null;
			const totalHeight = config.floors
				.filter((f) => f.floorType !== "ROOF")
				.reduce(
					(sum, f) => sum + f.height * (f.isRepeated ? f.repeatCount : 1),
					0,
				);
			return totalHeight ? Math.round(config.buildingPerimeter * totalHeight) : null;
		}
		case "roof_area": {
			const roofFloor = config.floors.find((f) => f.floorType === "ROOF");
			if (roofFloor?.area) return roofFloor.area;
			const regular = config.floors.filter(
				(f) => f.floorType !== "ROOF" && f.floorType !== "BASEMENT",
			);
			return regular[regular.length - 1]?.area ?? null;
		}
		case "roof_perimeter": {
			const roofArea = computeDerived("roof_area", config);
			if (!roofArea) return null;
			return Math.round(Math.sqrt(roofArea) * 4);
		}
		case "yard_area": {
			if (!config.totalLandArea) return null;
			const ground = config.floors.find((f) => f.floorType === "GROUND");
			const yard = config.totalLandArea - (ground?.area ?? 0);
			return yard > 0 ? Math.round(yard) : null;
		}
		default:
			return null;
	}
}

export const buildingConfigUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/building-config",
		tags: ["Quantities"],
		summary: "Update building configuration",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			buildingConfig: z.object({
				totalLandArea: z.number(),
				buildingPerimeter: z.number(),
				floors: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						area: z.number(),
						height: z.number(),
						sortOrder: z.number(),
						isRepeated: z.boolean().default(false),
						repeatCount: z.number().default(1),
						floorType: z.enum([
							"BASEMENT",
							"GROUND",
							"UPPER",
							"ANNEX",
							"ROOF",
							"MEZZANINE",
						]),
					}),
				),
			}),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		const updated = await updateBuildingConfig(
			input.costStudyId,
			input.organizationId,
			input.buildingConfig,
		);

		// ── Cascade update: recalculate all linked finishing items ──
		let updatedCount = 0;
		try {
			const items = await getFinishingItemsForCascade(input.costStudyId);
			const cascadeUpdates: Array<{
				id: string;
				area?: number;
				quantity?: number;
				length?: number;
				totalCost: number;
				materialCost: number;
				laborCost: number;
			}> = [];

			for (const item of items) {
				const calcData = item.calculationData as Record<string, unknown> | null;
				const linked = calcData?.linkedSource as LinkedSourceData | undefined;
				if (!linked || linked.type !== "building_config") continue;

				const newQty = computeDerived(
					linked.derivation,
					input.buildingConfig,
					(item.floorId ?? linked.floorId) as string | undefined,
				);
				if (newQty == null) continue;

				const wastage = 1 + (Number(item.wastagePercent) || 0) / 100;
				const matPrice = Number(item.materialPrice) || 0;
				const labPrice = Number(item.laborPrice) || 0;
				const unitCost = matPrice + labPrice;
				if (item.unit === "lump_sum") continue;

				const totalCost = newQty * wastage * unitCost;
				const materialCost = unitCost > 0 ? totalCost * (matPrice / unitCost) : 0;
				const laborCost = unitCost > 0 ? totalCost * (labPrice / unitCost) : 0;

				const upd: (typeof cascadeUpdates)[number] = {
					id: item.id,
					totalCost: Math.round(totalCost),
					materialCost: Math.round(materialCost),
					laborCost: Math.round(laborCost),
				};

				if (item.unit === "m2") upd.area = newQty;
				else if (item.unit === "m") upd.length = newQty;
				else upd.quantity = newQty;

				cascadeUpdates.push(upd);
			}

			if (cascadeUpdates.length > 0) {
				await batchUpdateFinishingItems(input.costStudyId, cascadeUpdates);
				updatedCount = cascadeUpdates.length;
			}
		} catch {
			// Cascade update is best-effort; building config save should still succeed
		}

		return {
			success: true,
			buildingConfig: updated.buildingConfig,
			cascadeUpdatedCount: updatedCount,
		};
	});

import {
	getCompanyAssets,
	getCompanyAssetById,
	createCompanyAsset,
	updateCompanyAsset,
	deactivateCompanyAsset,
	assignAssetToProject,
	returnAssetToWarehouse,
	getAssetSummary,
	getExpiringInsurance,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

const assetCategoryEnum = z.enum([
	"HEAVY_EQUIPMENT", "LIGHT_EQUIPMENT", "VEHICLES", "TOOLS",
	"IT_EQUIPMENT", "FURNITURE", "SAFETY_EQUIPMENT", "SURVEYING", "OTHER",
]);
const assetTypeEnum = z.enum(["OWNED", "RENTED", "LEASED"]);
const assetStatusEnum = z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED"]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST ASSETS
// ═══════════════════════════════════════════════════════════════════════════
export const listAssets = protectedProcedure
	.route({
		method: "GET",
		path: "/company/assets",
		tags: ["Company", "Assets"],
		summary: "List company assets",
	})
	.input(
		z.object({
			organizationId: z.string(),
			category: assetCategoryEnum.optional(),
			type: assetTypeEnum.optional(),
			status: assetStatusEnum.optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "assets",
		});

		return getCompanyAssets(input.organizationId, {
			category: input.category,
			type: input.type,
			status: input.status,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET ASSET BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getAssetByIdProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/assets/{id}",
		tags: ["Company", "Assets"],
		summary: "Get a single asset",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "assets",
		});

		const asset = await getCompanyAssetById(input.id, input.organizationId);
		if (!asset) throw new Error("Asset not found");
		return asset;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE ASSET
// ═══════════════════════════════════════════════════════════════════════════
export const createAssetProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/assets",
		tags: ["Company", "Assets"],
		summary: "Create a new company asset",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1, "اسم الأصل مطلوب"),
			assetNo: z.string().optional(),
			category: assetCategoryEnum,
			type: assetTypeEnum.optional(),
			brand: z.string().optional(),
			model: z.string().optional(),
			serialNumber: z.string().optional(),
			year: z.number().int().optional(),
			description: z.string().optional(),
			purchasePrice: z.number().min(0).optional(),
			monthlyRent: z.number().min(0).optional(),
			currentValue: z.number().min(0).optional(),
			purchaseDate: z.coerce.date().optional(),
			warrantyExpiry: z.coerce.date().optional(),
			insuranceExpiry: z.coerce.date().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "assets",
		});

		return createCompanyAsset(input);
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE ASSET
// ═══════════════════════════════════════════════════════════════════════════
export const updateAssetProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/company/assets/{id}",
		tags: ["Company", "Assets"],
		summary: "Update a company asset",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			name: z.string().min(1).optional(),
			assetNo: z.string().optional(),
			category: assetCategoryEnum.optional(),
			type: assetTypeEnum.optional(),
			status: assetStatusEnum.optional(),
			brand: z.string().nullable().optional(),
			model: z.string().nullable().optional(),
			serialNumber: z.string().nullable().optional(),
			year: z.number().int().nullable().optional(),
			description: z.string().nullable().optional(),
			purchasePrice: z.number().min(0).nullable().optional(),
			monthlyRent: z.number().min(0).nullable().optional(),
			currentValue: z.number().min(0).nullable().optional(),
			purchaseDate: z.coerce.date().nullable().optional(),
			warrantyExpiry: z.coerce.date().nullable().optional(),
			insuranceExpiry: z.coerce.date().nullable().optional(),
			notes: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "assets",
		});

		const { organizationId, id, ...data } = input;
		return updateCompanyAsset(id, organizationId, data);
	});

// ═══════════════════════════════════════════════════════════════════════════
// DEACTIVATE (RETIRE) ASSET
// ═══════════════════════════════════════════════════════════════════════════
export const deactivateAssetProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/assets/{id}/retire",
		tags: ["Company", "Assets"],
		summary: "Retire a company asset",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "assets",
		});

		return deactivateCompanyAsset(input.id, input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// ASSIGN ASSET TO PROJECT
// ═══════════════════════════════════════════════════════════════════════════
export const assignAssetToProjectProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/assets/{id}/assign",
		tags: ["Company", "Assets"],
		summary: "Assign an asset to a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "assets",
		});

		return assignAssetToProject(input.id, input.organizationId, input.projectId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// RETURN ASSET TO WAREHOUSE
// ═══════════════════════════════════════════════════════════════════════════
export const returnAssetProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/assets/{id}/return",
		tags: ["Company", "Assets"],
		summary: "Return an asset to warehouse",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "assets",
		});

		return returnAssetToWarehouse(input.id, input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET ASSET SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const getAssetSummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/assets/summary",
		tags: ["Company", "Assets"],
		summary: "Get asset summary statistics",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "assets",
		});

		return getAssetSummary(input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET EXPIRING INSURANCE
// ═══════════════════════════════════════════════════════════════════════════
export const getExpiringInsuranceProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/assets/expiring-insurance",
		tags: ["Company", "Assets"],
		summary: "Get assets with expiring insurance",
	})
	.input(
		z.object({
			organizationId: z.string(),
			daysAhead: z.number().optional().default(30),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "assets",
		});

		return getExpiringInsurance(input.organizationId, input.daysAhead);
	});

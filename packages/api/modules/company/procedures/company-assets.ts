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
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import {
	idString,
	trimmedString,
	optionalTrimmed,
	nullishTrimmed,
	searchQuery,
	financialAmount,
	paginationLimit,
	paginationOffset,
	dayCount,
	MAX_NAME,
	MAX_DESC,
	MAX_CODE,
} from "../../../lib/validation-constants";

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
			organizationId: idString(),
			category: assetCategoryEnum.optional(),
			type: assetTypeEnum.optional(),
			status: assetStatusEnum.optional(),
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
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
			organizationId: idString(),
			id: idString(),
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
export const createAssetProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/assets",
		tags: ["Company", "Assets"],
		summary: "Create a new company asset",
	})
	.input(
		z.object({
			organizationId: idString(),
			name: trimmedString(MAX_NAME),
			assetNo: optionalTrimmed(MAX_CODE),
			category: assetCategoryEnum,
			type: assetTypeEnum.optional(),
			brand: optionalTrimmed(MAX_NAME),
			model: optionalTrimmed(MAX_NAME),
			serialNumber: optionalTrimmed(MAX_CODE),
			year: z.number().int().min(1900).max(2100).optional(),
			description: optionalTrimmed(MAX_DESC),
			purchasePrice: financialAmount().optional(),
			monthlyRent: financialAmount().optional(),
			currentValue: financialAmount().optional(),
			purchaseDate: z.coerce.date().optional(),
			warrantyExpiry: z.coerce.date().optional(),
			insuranceExpiry: z.coerce.date().optional(),
			notes: optionalTrimmed(MAX_DESC),
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
export const updateAssetProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/company/assets/{id}",
		tags: ["Company", "Assets"],
		summary: "Update a company asset",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			name: trimmedString(MAX_NAME).optional(),
			assetNo: optionalTrimmed(MAX_CODE),
			category: assetCategoryEnum.optional(),
			type: assetTypeEnum.optional(),
			status: assetStatusEnum.optional(),
			brand: nullishTrimmed(MAX_NAME),
			model: nullishTrimmed(MAX_NAME),
			serialNumber: nullishTrimmed(MAX_CODE),
			year: z.number().int().min(1900).max(2100).nullable().optional(),
			description: nullishTrimmed(MAX_DESC),
			purchasePrice: financialAmount().nullable().optional(),
			monthlyRent: financialAmount().nullable().optional(),
			currentValue: financialAmount().nullable().optional(),
			purchaseDate: z.coerce.date().nullable().optional(),
			warrantyExpiry: z.coerce.date().nullable().optional(),
			insuranceExpiry: z.coerce.date().nullable().optional(),
			notes: nullishTrimmed(MAX_DESC),
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
export const deactivateAssetProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/assets/{id}/retire",
		tags: ["Company", "Assets"],
		summary: "Retire a company asset",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
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
export const assignAssetToProjectProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/assets/{id}/assign",
		tags: ["Company", "Assets"],
		summary: "Assign an asset to a project",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			projectId: idString(),
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
export const returnAssetProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/assets/{id}/return",
		tags: ["Company", "Assets"],
		summary: "Return an asset to warehouse",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
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
	.input(z.object({ organizationId: idString() }))
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
			organizationId: idString(),
			daysAhead: dayCount().optional().default(30),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "assets",
		});

		return getExpiringInsurance(input.organizationId, input.daysAhead);
	});

import { z } from "zod";
import { idString, domainEnum, studyScope } from "./common";

export const getCatalogSchema = z.object({
	organizationId: idString(),
	domain: domainEnum.optional(),
	categoryKey: z.string().max(100).optional(),
	search: z.string().max(200).optional(),
});

export const getPresetsSchema = z.object({
	organizationId: idString(),
});

export const applyPresetSchema = studyScope.extend({
	presetKey: z.string().min(1).max(100),
});

// Handover Protocols — Shared schemas, enums, and types

import { z } from "zod";
import {
	trimmedString,
	optionalTrimmed,
	MAX_NAME,
	MAX_CODE,
} from "../../../lib/validation-constants";

// ═══ Shared enums ═══
export const handoverTypeEnum = z.enum([
	"ITEM_ACCEPTANCE",
	"PRELIMINARY",
	"FINAL",
	"DELIVERY",
]);

export const handoverStatusEnum = z.enum([
	"DRAFT",
	"PENDING_SIGNATURES",
	"PARTIALLY_SIGNED",
	"COMPLETED",
	"ARCHIVED",
]);

export const qualityRatingEnum = z.enum([
	"EXCELLENT",
	"GOOD",
	"ACCEPTABLE",
	"NEEDS_REWORK",
	"REJECTED",
]);

export const partySchema = z.object({
	name: trimmedString(MAX_NAME),
	role: trimmedString(MAX_NAME),
	organization: optionalTrimmed(MAX_NAME),
	signed: z.boolean().default(false),
	signedAt: z.string().trim().max(MAX_CODE).nullable().optional(),
});

/** Runtime shape of a party stored as JSON in the protocol */
export type HandoverParty = {
	name: string;
	role: string;
	organization?: string;
	signed: boolean;
	signedAt: string | null;
};

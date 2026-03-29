/**
 * Shared geographic constants for client forms.
 * Display labels come from translation keys: finance.geography.saudiRegions.{key}
 */

export const SAUDI_REGION_KEYS = [
	"riyadh",
	"makkah",
	"madinah",
	"qassim",
	"eastern",
	"asir",
	"tabuk",
	"hail",
	"northernBorders",
	"jazan",
	"najran",
	"bahah",
	"jouf",
] as const;

export const COUNTRY_CODES = [
	"SA",
	"AE",
	"KW",
	"QA",
	"BH",
	"OM",
	"EG",
	"JO",
] as const;

export type SaudiRegionKey = (typeof SAUDI_REGION_KEYS)[number];
export type CountryCode = (typeof COUNTRY_CODES)[number];

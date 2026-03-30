import { z } from "zod";

// ── String limits ──
export const MAX_NAME = 200;
export const MAX_DESC = 2000;
export const MAX_CODE = 50;
export const MAX_SEARCH = 200;
export const MAX_LONG_TEXT = 5000;
export const MAX_ADDRESS = 500;
export const MAX_PHONE = 20;
export const MAX_EMAIL = 254;
export const MAX_URL = 2048;
export const MAX_ID = 100;

// ── Number limits ──
export const MAX_FINANCIAL = 999_999_999.99;
export const MAX_QUANTITY = 999_999;
export const MAX_UNIT_PRICE = 99_999_999.99;
export const MAX_PERCENT = 100;
export const MAX_DAYS = 3650;
export const MAX_PAGINATION = 500;
export const MAX_ARRAY = 1000;

// ── String helpers ──
export const trimmedString = (max: number) => z.string().trim().min(1).max(max);
export const optionalTrimmed = (max: number) =>
	z.string().trim().max(max).optional();
export const nullishTrimmed = (max: number) =>
	z.string().trim().max(max).nullish();
export const idString = () => z.string().trim().max(MAX_ID);
export const searchQuery = () => z.string().trim().max(MAX_SEARCH).optional();

// ── Number helpers ──
export const financialAmount = () =>
	z.number().nonnegative().max(MAX_FINANCIAL);
export const positiveAmount = () => z.number().positive().max(MAX_FINANCIAL);
export const signedAmount = () =>
	z.number().min(-MAX_FINANCIAL).max(MAX_FINANCIAL);
export const coerceFinancialAmount = () =>
	z.coerce.number().nonnegative().max(MAX_FINANCIAL);
export const percentage = () => z.number().min(0).max(MAX_PERCENT);
export const quantity = () => z.number().nonnegative().max(MAX_QUANTITY);
export const unitPrice = () => z.number().nonnegative().max(MAX_UNIT_PRICE);
export const dayCount = () => z.number().int().min(0).max(MAX_DAYS);

// ── Pagination helpers ──
export const paginationLimit = () =>
	z.number().int().min(1).max(MAX_PAGINATION).optional().default(50);
export const paginationOffset = () =>
	z.number().int().nonnegative().optional().default(0);

/**
 * Preference resolution — precedence rules
 *
 * resolveEventChannels: exact event key override > module wildcard > registry
 * default. isValidPrefKey guards the update procedure against junk keys.
 */
import { describe, expect, it } from "vitest";
import {
	NOTIFICATION_EVENT_BY_KEY,
	getEventTypesForModule,
	isValidPrefKey,
	moduleWildcard,
	resolveEventChannels,
} from "@repo/database/prisma/notification-registry";

const invoiceIssued = NOTIFICATION_EVENT_BY_KEY["finance.invoiceIssued"];
const issueCritical = NOTIFICATION_EVENT_BY_KEY["projects.issueCritical"];

describe("resolveEventChannels", () => {
	it("falls back to registry defaults with no prefs", () => {
		expect(resolveEventChannels(invoiceIssued, null)).toEqual(["IN_APP"]);
		expect(resolveEventChannels(issueCritical, undefined)).toEqual([
			"IN_APP",
			"EMAIL",
		]);
	});

	it("exact key beats module wildcard", () => {
		const prefs = {
			"finance.invoiceIssued": ["IN_APP", "EMAIL"] as ("IN_APP" | "EMAIL")[],
			"finance.*": [] as ("IN_APP" | "EMAIL")[],
		};
		expect(resolveEventChannels(invoiceIssued, prefs)).toEqual([
			"IN_APP",
			"EMAIL",
		]);
	});

	it("module wildcard beats registry default", () => {
		const prefs = { "finance.*": [] as ("IN_APP" | "EMAIL")[] };
		expect(resolveEventChannels(invoiceIssued, prefs)).toEqual([]);
	});

	it("empty exact override disables the event", () => {
		const prefs = { "projects.issueCritical": [] as ("IN_APP" | "EMAIL")[] };
		expect(resolveEventChannels(issueCritical, prefs)).toEqual([]);
	});

	it("ignores unrelated keys", () => {
		const prefs = { "hr.*": [] as ("IN_APP" | "EMAIL")[] };
		expect(resolveEventChannels(invoiceIssued, prefs)).toEqual(["IN_APP"]);
	});
});

describe("isValidPrefKey", () => {
	it("accepts registry event keys and module wildcards", () => {
		expect(isValidPrefKey("finance.invoiceIssued")).toBe(true);
		expect(isValidPrefKey(moduleWildcard("finance"))).toBe(true);
		expect(isValidPrefKey("chat.*")).toBe(true);
	});

	it("rejects unknown keys", () => {
		expect(isValidPrefKey("finance.doesNotExist")).toBe(false);
		expect(isValidPrefKey("nonmodule.*")).toBe(false);
		expect(isValidPrefKey("INVOICE_ISSUED")).toBe(false);
		expect(isValidPrefKey("")).toBe(false);
	});
});

describe("getEventTypesForModule", () => {
	it("includes registry keys and legacy enum values", () => {
		const types = getEventTypesForModule("projects");
		expect(types).toContain("projects.dailyReportCreated");
		expect(types).toContain("DAILY_REPORT_CREATED");
		expect(types).toContain("projects.issueCritical");
		expect(types).toContain("ISSUE_CRITICAL");
	});

	it("does not leak other modules' keys", () => {
		const types = getEventTypesForModule("finance");
		expect(types).not.toContain("projects.dailyReportCreated");
		expect(types.every((t) => !t.startsWith("hr."))).toBe(true);
	});
});

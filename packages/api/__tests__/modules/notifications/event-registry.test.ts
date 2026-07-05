/**
 * Event Registry — completeness & integrity tests
 *
 * The registry is the single source of truth for every notification event.
 * These tests guarantee that adding an event can't silently break routing,
 * preferences, or the settings panel:
 *   - unique, well-formed keys (module.leafName)
 *   - permission gates reference real Permissions sections/actions
 *   - every legacy NotificationType enum value is still covered
 *   - ar.json AND en.json carry title+description labels for every event
 *   - content templates render a non-empty Arabic title
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	NOTIFICATION_EVENT_BY_KEY,
	NOTIFICATION_MODULES,
	NOTIFICATION_REGISTRY,
	eventLeafName,
} from "@repo/database/prisma/notification-registry";
import { createEmptyPermissions } from "@repo/database/prisma/permissions";

const MODULE_KEYS = NOTIFICATION_MODULES.map((m) => m.key);

const LEGACY_TYPES = [
	"APPROVAL_REQUESTED",
	"APPROVAL_DECIDED",
	"DOCUMENT_CREATED",
	"DAILY_REPORT_CREATED",
	"ISSUE_CREATED",
	"ISSUE_CRITICAL",
	"EXPENSE_CREATED",
	"CLAIM_CREATED",
	"CLAIM_STATUS_CHANGED",
	"CHANGE_ORDER_CREATED",
	"CHANGE_ORDER_APPROVED",
	"CHANGE_ORDER_REJECTED",
	"OWNER_MESSAGE",
	"TEAM_MEMBER_ADDED",
	"TEAM_MEMBER_REMOVED",
	"SYSTEM",
];

function loadTranslations(file: string): Record<string, unknown> {
	const path = resolve(__dirname, "../../../../i18n/translations", file);
	return JSON.parse(readFileSync(path, "utf8"));
}

function getNested(obj: Record<string, unknown>, path: string[]): unknown {
	let current: unknown = obj;
	for (const key of path) {
		if (typeof current !== "object" || current === null) {
			return undefined;
		}
		current = (current as Record<string, unknown>)[key];
	}
	return current;
}

describe("notification event registry", () => {
	it("has unique keys", () => {
		const keys = NOTIFICATION_REGISTRY.map((e) => e.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("every key is <module>.<leafName> matching its module field", () => {
		for (const event of NOTIFICATION_REGISTRY) {
			const [prefix] = event.key.split(".");
			expect(prefix, event.key).toBe(event.module);
			expect(eventLeafName(event.key).length, event.key).toBeGreaterThan(0);
			expect(MODULE_KEYS, event.key).toContain(event.module);
		}
	});

	it("permission gates reference real sections and actions", () => {
		const empty = createEmptyPermissions();
		for (const event of NOTIFICATION_REGISTRY) {
			if (!event.permission) {
				continue;
			}
			const section = empty[event.permission.section];
			expect(section, `${event.key}: section ${event.permission.section}`).toBeDefined();
			expect(
				event.permission.action in (section as Record<string, boolean>),
				`${event.key}: action ${event.permission.section}.${event.permission.action}`,
			).toBe(true);
		}
	});

	it("every event has a non-empty audience and valid default channels", () => {
		for (const event of NOTIFICATION_REGISTRY) {
			expect(event.audience.length, event.key).toBeGreaterThan(0);
			for (const channel of event.defaultChannels) {
				expect(["IN_APP", "EMAIL"], event.key).toContain(channel);
			}
			expect(event.entityType.length, event.key).toBeGreaterThan(0);
		}
	});

	it("explicit-audience events carry no org-wide permission gate surprises", () => {
		// events whose ONLY audience is explicit are personal → gate must be null
		for (const event of NOTIFICATION_REGISTRY) {
			const onlyExplicit = event.audience.every((a) => a.kind === "explicit");
			if (onlyExplicit) {
				expect(event.permission, `${event.key} is personal`).toBeNull();
			}
		}
	});

	it("covers every legacy NotificationType enum value exactly once", () => {
		const seen = new Map<string, string>();
		for (const event of NOTIFICATION_REGISTRY) {
			for (const legacy of event.legacyTypes ?? []) {
				expect(seen.has(legacy), `${legacy} mapped twice`).toBe(false);
				seen.set(legacy, event.key);
			}
		}
		for (const legacy of LEGACY_TYPES) {
			expect(seen.has(legacy), `legacy ${legacy} not covered`).toBe(true);
		}
	});

	it("content templates render a non-empty title", () => {
		const sample = {
			projectName: "مشروع فيلا",
			invoiceNo: "INV-2026-0001",
			amount: "1,000.00 ر.س",
			clientName: "عميل",
			voucherNo: "PMT-2026-0001",
			quotationNo: "Q-1",
			status: "معتمد",
			decision: "تمت الموافقة على",
			employeeName: "موظف",
			startDate: "2026-01-01",
			endDate: "2026-01-05",
			period: "6/2026",
			claimNo: 3,
			coNo: 2,
			title: "بند",
			issueTitle: "مشكلة",
			reportDate: "2026-01-01",
			protocolTitle: "محضر",
			signerName: "موقّع",
			documentTitle: "مستند",
			fileName: "ملف.pdf",
			senderName: "مرسل",
			preview: "نص",
			studyName: "دراسة",
			userName: "مستخدم",
			roleName: "محاسب",
			ownerName: "شريك",
			subcontractorName: "مقاول",
			fromAccount: "بنك أ",
			toAccount: "بنك ب",
			category: "مواد",
			source: "عميل",
			leaveType: "سنوية",
			jobTitle: "مهندس",
			progress: 50,
			count: 3,
			body: "نص",
		};
		for (const event of NOTIFICATION_REGISTRY) {
			const content = event.content(sample);
			expect(content.title.trim().length, event.key).toBeGreaterThan(0);
		}
	});

	it("NOTIFICATION_EVENT_BY_KEY covers the whole registry", () => {
		expect(Object.keys(NOTIFICATION_EVENT_BY_KEY).length).toBe(
			NOTIFICATION_REGISTRY.length,
		);
	});

	describe.each(["ar.json", "en.json"])("%s labels", (file) => {
		const translations = loadTranslations(file);

		it("has a label for every module", () => {
			for (const module of MODULE_KEYS) {
				const label = getNested(translations, [
					"notifications",
					"modules",
					module,
				]);
				expect(typeof label, `notifications.modules.${module}`).toBe("string");
			}
		});

		it("has title + description for every event", () => {
			for (const event of NOTIFICATION_REGISTRY) {
				const leaf = eventLeafName(event.key);
				for (const field of ["title", "description"]) {
					const value = getNested(translations, [
						"notifications",
						"events",
						event.module,
						leaf,
						field,
					]);
					expect(
						typeof value,
						`notifications.events.${event.module}.${leaf}.${field} in ${file}`,
					).toBe("string");
					expect((value as string).trim().length).toBeGreaterThan(0);
				}
			}
		});
	});
});

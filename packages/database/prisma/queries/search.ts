import { db } from "../client";

// ═══════════════════════════════════════════════════════════════════════════
// Global Organization Search - البحث الشامل داخل المنظمة
// Cross-entity search scoped to a single organization. Every query is filtered
// by organizationId; the caller decides which sections to include based on the
// member's permissions (see modules/search).
// ═══════════════════════════════════════════════════════════════════════════

export type GlobalSearchType =
	| "project"
	| "client"
	| "invoice"
	| "quotation"
	| "study"
	| "payment"
	| "employee"
	| "lead";

export interface GlobalSearchResult {
	type: GlobalSearchType;
	id: string;
	title: string;
	subtitle: string | null;
	/** Extra id needed to build nested routes (unused for top-level entities). */
	parentId?: string | null;
}

export interface GlobalSearchSections {
	projects: boolean;
	finance: boolean;
	pricing: boolean;
	company: boolean;
}

interface GlobalSearchOptions {
	organizationId: string;
	query: string;
	sections: GlobalSearchSections;
	/** Max rows per entity type. */
	perTypeLimit?: number;
}

/**
 * Search across the organization's core entities (projects, clients, invoices,
 * quotations, cost studies, payments, employees, leads) by name / number.
 * Returns a flat, typed result list — grouping/labelling is done on the client.
 */
export async function globalOrganizationSearch({
	organizationId,
	query,
	sections,
	perTypeLimit = 5,
}: GlobalSearchOptions): Promise<GlobalSearchResult[]> {
	const q = query.trim();
	// Guard: a 1-char query would scan almost everything for no value.
	if (q.length < 2) {
		return [];
	}

	const contains = { contains: q, mode: "insensitive" as const };
	const take = perTypeLimit;
	const tasks: Array<Promise<GlobalSearchResult[]>> = [];

	if (sections.projects) {
		tasks.push(
			db.project
				.findMany({
					where: {
						organizationId,
						OR: [
							{ name: contains },
							{ projectNo: contains },
							{ clientName: contains },
						],
					},
					select: {
						id: true,
						name: true,
						projectNo: true,
						clientName: true,
					},
					take,
				})
				.then((rows) =>
					rows.map((r) => ({
						type: "project" as const,
						id: r.id,
						title: r.name,
						subtitle: r.projectNo ?? r.clientName ?? null,
					})),
				),
		);
	}

	if (sections.finance) {
		tasks.push(
			db.financeInvoice
				.findMany({
					where: {
						organizationId,
						OR: [{ invoiceNo: contains }, { clientName: contains }],
					},
					select: { id: true, invoiceNo: true, clientName: true },
					take,
				})
				.then((rows) =>
					rows.map((r) => ({
						type: "invoice" as const,
						id: r.id,
						title: r.invoiceNo,
						subtitle: r.clientName ?? null,
					})),
				),
		);

		tasks.push(
			db.client
				.findMany({
					where: {
						organizationId,
						OR: [
							{ name: contains },
							{ businessName: contains },
							{ phone: contains },
							{ mobile: contains },
							{ email: contains },
						],
					},
					select: {
						id: true,
						name: true,
						phone: true,
						mobile: true,
						email: true,
					},
					take,
				})
				.then((rows) =>
					rows.map((r) => ({
						type: "client" as const,
						id: r.id,
						title: r.name,
						subtitle: r.mobile ?? r.phone ?? r.email ?? null,
					})),
				),
		);

		tasks.push(
			db.financePayment
				.findMany({
					where: {
						organizationId,
						OR: [{ paymentNo: contains }, { clientName: contains }],
					},
					select: { id: true, paymentNo: true, clientName: true },
					take,
				})
				.then((rows) =>
					rows.map((r) => ({
						type: "payment" as const,
						id: r.id,
						title: r.paymentNo,
						subtitle: r.clientName ?? null,
					})),
				),
		);
	}

	if (sections.pricing) {
		tasks.push(
			db.costStudy
				.findMany({
					where: {
						organizationId,
						OR: [{ name: contains }, { customerName: contains }],
					},
					select: { id: true, name: true, customerName: true },
					take,
				})
				.then((rows) =>
					rows.map((r) => ({
						type: "study" as const,
						id: r.id,
						title: r.name ?? r.customerName ?? "—",
						subtitle: r.customerName ?? null,
					})),
				),
		);

		tasks.push(
			db.quotation
				.findMany({
					where: {
						organizationId,
						OR: [{ quotationNo: contains }, { clientName: contains }],
					},
					select: { id: true, quotationNo: true, clientName: true },
					take,
				})
				.then((rows) =>
					rows.map((r) => ({
						type: "quotation" as const,
						id: r.id,
						title: r.quotationNo,
						subtitle: r.clientName ?? null,
					})),
				),
		);

		tasks.push(
			db.lead
				.findMany({
					where: {
						organizationId,
						OR: [
							{ name: contains },
							{ company: contains },
							{ phone: contains },
						],
					},
					select: { id: true, name: true, company: true, phone: true },
					take,
				})
				.then((rows) =>
					rows.map((r) => ({
						type: "lead" as const,
						id: r.id,
						title: r.name,
						subtitle: r.company ?? r.phone ?? null,
					})),
				),
		);
	}

	if (sections.company) {
		tasks.push(
			db.employee
				.findMany({
					where: {
						organizationId,
						OR: [
							{ name: contains },
							{ employeeNo: contains },
							{ phone: contains },
							{ nationalId: contains },
						],
					},
					select: { id: true, name: true, employeeNo: true },
					take,
				})
				.then((rows) =>
					rows.map((r) => ({
						type: "employee" as const,
						id: r.id,
						title: r.name,
						subtitle: r.employeeNo ?? null,
					})),
				),
		);
	}

	const settled = await Promise.all(tasks);
	return settled.flat();
}

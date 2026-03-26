// Accounting Health Check — validates data integrity of the accounting system

import { type PrismaClient, Prisma } from "../generated/client";

const ZERO = new Prisma.Decimal(0);

export async function checkAccountingHealth(
	db: PrismaClient,
	organizationId: string,
) {
	// 1. Unbalanced entries — SUM(debit) != SUM(credit) per entry
	const unbalancedEntries = await db.$queryRaw<Array<{ id: string; entry_no: string; diff: number }>>`
		SELECT je.id, je."entry_no" as entry_no,
			COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as diff
		FROM "journal_entries" je
		JOIN "journal_entry_lines" jel ON jel."journal_entry_id" = je.id
		WHERE je."organization_id" = ${organizationId}
			AND je.status = 'POSTED'
		GROUP BY je.id, je."entry_no"
		HAVING ABS(COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)) > 0.01
		LIMIT 50
	`;

	// 2. Invoices without entries — ISSUED/PAID invoices missing INVOICE journal entry
	const invoicesWithoutEntries = await db.$queryRaw<Array<{ id: string; invoice_no: string; status: string }>>`
		SELECT fi.id, fi."invoice_no" as invoice_no, fi.status
		FROM "finance_invoices" fi
		WHERE fi."organization_id" = ${organizationId}
			AND fi.status IN ('ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE')
			AND fi."invoice_type" != 'CREDIT_NOTE'
			AND NOT EXISTS (
				SELECT 1 FROM "journal_entries" je
				WHERE je."organization_id" = ${organizationId}
					AND je."reference_type" = 'INVOICE'
					AND je."reference_id" = fi.id
					AND je.status != 'REVERSED'
			)
		LIMIT 50
	`;

	// 3. Orphaned entries — entries referencing deleted invoices
	const orphanedInvoiceEntries = await db.$queryRaw<Array<{ id: string; entry_no: string; reference_id: string }>>`
		SELECT je.id, je."entry_no" as entry_no, je."reference_id" as reference_id
		FROM "journal_entries" je
		WHERE je."organization_id" = ${organizationId}
			AND je."reference_type" = 'INVOICE'
			AND je.status = 'POSTED'
			AND je."reference_id" IS NOT NULL
			AND NOT EXISTS (
				SELECT 1 FROM "finance_invoices" fi WHERE fi.id = je."reference_id"
			)
		LIMIT 50
	`;

	// 4. Expenses without entries — COMPLETED expenses missing EXPENSE journal entry
	const expensesWithoutEntries = await db.$queryRaw<Array<{ id: string; description: string }>>`
		SELECT fe.id, fe.description
		FROM "finance_expenses" fe
		WHERE fe."organization_id" = ${organizationId}
			AND fe.status = 'COMPLETED'
			AND fe."source_type" != 'FACILITY_PAYROLL'
			AND NOT EXISTS (
				SELECT 1 FROM "journal_entries" je
				WHERE je."organization_id" = ${organizationId}
					AND je."reference_type" = 'EXPENSE'
					AND je."reference_id" = fe.id
					AND je.status != 'REVERSED'
			)
		LIMIT 50
	`;

	const isHealthy =
		unbalancedEntries.length === 0 &&
		invoicesWithoutEntries.length === 0 &&
		orphanedInvoiceEntries.length === 0 &&
		expensesWithoutEntries.length === 0;

	return {
		unbalancedEntries,
		invoicesWithoutEntries,
		orphanedInvoiceEntries,
		expensesWithoutEntries,
		isHealthy,
		checkedAt: new Date().toISOString(),
	};
}

// Reconcile PROJECT_PAYMENT journal entries with the project's billing state.
//
// A payment on an unbilled (cash-basis) project must credit revenue (4100);
// once the project has approved claims or issued invoices, payments collect an
// existing receivable and must credit 1120 instead. Entries drift out of line
// in two ways:
//
// - Entries posted before the cash-basis fix (dd82ff06) always credited 1120,
//   leaving cash projects with negative receivables and no revenue in reports.
// - A project billed *after* cash-basis payments leaves those payments
//   crediting 4100, double-counting revenue once the claim/invoice entry posts
//   (and vice versa when the last claim/invoice is rejected or deleted).
//
// Mismatched entries are reversed and recreated through the live hook, which
// resolves the correct credit side. Callers wrap this in the same
// silent-failure contract as the auto-journal hooks.

import type { PrismaClient } from "@repo/database/prisma/generated/client";
import { isPeriodClosed } from "@repo/database";
import {
	onProjectPaymentReceived,
	projectHasBillingDocuments,
	reverseAutoJournalEntry,
} from "./auto-journal";

export interface ReconcileProjectPaymentsResult {
	checked: number;
	repaired: number;
	errors: { paymentNo: string; error: string }[];
}

export async function reconcileProjectPaymentEntries(
	db: PrismaClient,
	opts: { organizationId: string; projectId?: string; userId: string },
): Promise<ReconcileProjectPaymentsResult> {
	const result: ReconcileProjectPaymentsResult = {
		checked: 0,
		repaired: 0,
		errors: [],
	};

	const [receivable, revenue] = await Promise.all([
		db.chartAccount.findUnique({
			where: { organizationId_code: { organizationId: opts.organizationId, code: "1120" } },
			select: { id: true },
		}),
		db.chartAccount.findUnique({
			where: { organizationId_code: { organizationId: opts.organizationId, code: "4100" } },
			select: { id: true },
		}),
	]);
	if (!receivable || !revenue) return result;

	const payments = await db.projectPayment.findMany({
		where: {
			organizationId: opts.organizationId,
			...(opts.projectId ? { projectId: opts.projectId } : {}),
		},
		select: {
			id: true,
			amount: true,
			date: true,
			destinationAccountId: true,
			projectId: true,
			paymentNo: true,
		},
	});
	if (payments.length === 0) return result;

	const billingByProject = new Map<string, boolean>();

	// Fetch all POSTED PROJECT_PAYMENT entries for these payments in ONE query
	// instead of one findFirst per payment (this runs on every invoice issue).
	const entries = await db.journalEntry.findMany({
		where: {
			organizationId: opts.organizationId,
			referenceType: "PROJECT_PAYMENT",
			referenceId: { in: payments.map((p) => p.id) },
			status: "POSTED",
		},
		select: {
			referenceId: true,
			lines: { where: { credit: { gt: 0 } }, select: { accountId: true } },
		},
	});
	const entryByPaymentId = new Map(
		entries.map((e) => [e.referenceId as string, e]),
	);

	for (const payment of payments) {
		let hasBilling = billingByProject.get(payment.projectId);
		if (hasBilling === undefined) {
			hasBilling = await projectHasBillingDocuments(db, opts.organizationId, payment.projectId);
			billingByProject.set(payment.projectId, hasBilling);
		}
		const expectedId = hasBilling ? receivable.id : revenue.id;
		const wrongId = hasBilling ? revenue.id : receivable.id;

		const entry = entryByPaymentId.get(payment.id);
		if (!entry) continue;
		result.checked++;

		// Only repair entries whose credit side sits on the opposite of the two
		// known accounts — anything else was posted by a different rule.
		const mismatched =
			entry.lines.some((l) => l.accountId === wrongId) &&
			!entry.lines.some((l) => l.accountId === expectedId);
		if (!mismatched) continue;

		try {
			// Recreating in a closed period would silently skip and leave the
			// payment with no active entry — keep the old one instead.
			if (await isPeriodClosed(db, opts.organizationId, payment.date)) {
				result.errors.push({ paymentNo: payment.paymentNo, error: "period closed" });
				continue;
			}
			await reverseAutoJournalEntry(db, {
				organizationId: opts.organizationId,
				referenceType: "PROJECT_PAYMENT",
				referenceId: payment.id,
				userId: opts.userId,
			});
			await onProjectPaymentReceived(db, {
				id: payment.id,
				organizationId: opts.organizationId,
				amount: payment.amount,
				date: payment.date,
				destinationAccountId: payment.destinationAccountId ?? "",
				projectId: payment.projectId,
				paymentNo: payment.paymentNo,
				userId: opts.userId,
			});
			result.repaired++;
		} catch (e) {
			result.errors.push({ paymentNo: payment.paymentNo, error: String(e) });
		}
	}

	return result;
}

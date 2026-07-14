// Backfill Journal Entries — generates accounting entries for historical financial operations
// Used when accounting mode is enabled on existing data

import { type PrismaClient, Prisma } from "@repo/database/prisma/generated/client";
import { createOwnerDrawingAccount } from "@repo/database";
import {
	onInvoiceIssued,
	onInvoicePaymentReceived,
	onExpenseCompleted,
	onTransferCompleted,
	onSubcontractPayment,
	onPayrollApproved,
	onOrganizationPaymentReceived,
	onCreditNoteIssued,
	onProjectPaymentReceived,
	onSubcontractClaimApproved,
	onProjectClaimApproved,
	onOwnerDrawing,
	onCapitalContribution,
} from "./auto-journal";

export interface BackfillResult {
	invoices: number;
	invoicePayments: number;
	expenses: number;
	transfers: number;
	subcontractPayments: number;
	payroll: number;
	orgPayments: number;
	creditNotes: number;
	projectPayments: number;
	projectPaymentsRepaired: number;
	claimsApproved: number;
	projectClaimsApproved: number;
	ownerDrawings: number;
	capitalContributions: number;
	total: number;
	errors: { type: string; id: string; error: string }[];
}

export async function backfillJournalEntries(
	db: PrismaClient,
	organizationId: string,
	userId?: string,
): Promise<BackfillResult> {
	const r: BackfillResult = {
		invoices: 0, invoicePayments: 0, expenses: 0, transfers: 0,
		subcontractPayments: 0, payroll: 0, orgPayments: 0, creditNotes: 0,
		projectPayments: 0, projectPaymentsRepaired: 0, claimsApproved: 0, projectClaimsApproved: 0,
		ownerDrawings: 0, capitalContributions: 0, total: 0, errors: [],
	};

	async function hasEntry(refType: string, refId: string): Promise<boolean> {
		const c = await db.journalEntry.count({
			where: { organizationId, referenceType: refType, referenceId: refId, status: { not: "REVERSED" } },
		});
		return c > 0;
	}

	// --- 1. Invoices (not DRAFT/CANCELLED, not CREDIT_NOTE) ---
	const invoices = await db.financeInvoice.findMany({
		where: { organizationId, status: { notIn: ["DRAFT", "CANCELLED"] }, invoiceType: { not: "CREDIT_NOTE" } },
		select: { id: true, invoiceNo: true, issueDate: true, clientName: true, totalAmount: true, vatAmount: true, projectId: true },
	});
	for (const inv of invoices) {
		if (await hasEntry("INVOICE", inv.id)) continue;
		try {
			await onInvoiceIssued(db, {
				id: inv.id, organizationId, number: inv.invoiceNo, issueDate: inv.issueDate,
				clientName: inv.clientName || "", totalAmount: inv.totalAmount, vatAmount: inv.vatAmount, projectId: inv.projectId,
			});
			r.invoices++;
		} catch (e: any) { r.errors.push({ type: "INVOICE", id: inv.invoiceNo, error: e.message }); }
	}

	// --- 2. Credit Notes ---
	const cns = await db.financeInvoice.findMany({
		where: { organizationId, invoiceType: "CREDIT_NOTE", status: { notIn: ["DRAFT", "CANCELLED"] } },
		select: { id: true, invoiceNo: true, issueDate: true, clientName: true, totalAmount: true, vatAmount: true, projectId: true },
	});
	for (const cn of cns) {
		if (await hasEntry("CREDIT_NOTE", cn.id)) continue;
		try {
			await onCreditNoteIssued(db, {
				id: cn.id, organizationId, number: cn.invoiceNo, issueDate: cn.issueDate,
				clientName: cn.clientName || "", totalAmount: cn.totalAmount.abs(), vatAmount: cn.vatAmount.abs(), projectId: cn.projectId,
			});
			r.creditNotes++;
		} catch (e: any) { r.errors.push({ type: "CREDIT_NOTE", id: cn.invoiceNo, error: e.message }); }
	}

	// --- 3. Invoice Payments ---
	const invPays = await db.financeInvoicePayment.findMany({
		where: { invoice: { organizationId } },
		select: {
			id: true, invoiceId: true, amount: true, paymentDate: true, sourceAccountId: true,
			invoice: { select: { invoiceNo: true, clientName: true, projectId: true } },
		},
	});
	for (const p of invPays) {
		if (await hasEntry("INVOICE_PAYMENT", p.id)) continue;
		try {
			await onInvoicePaymentReceived(db, {
				paymentId: p.id, organizationId, invoiceId: p.invoiceId, invoiceNumber: p.invoice.invoiceNo,
				clientName: p.invoice.clientName || "", amount: p.amount, date: p.paymentDate,
				sourceAccountId: p.sourceAccountId || "", projectId: p.invoice.projectId,
			});
			r.invoicePayments++;
		} catch (e: any) { r.errors.push({ type: "INVOICE_PAYMENT", id: p.id, error: e.message }); }
	}

	// --- 4. Completed Expenses (skip FACILITY_PAYROLL) ---
	const expenses = await db.financeExpense.findMany({
		where: { organizationId, status: "COMPLETED" },
		select: { id: true, category: true, amount: true, date: true, description: true, sourceAccountId: true, projectId: true, sourceType: true },
	});
	for (const exp of expenses) {
		if (exp.sourceType === "FACILITY_PAYROLL") continue;
		if (await hasEntry("EXPENSE", exp.id)) continue;
		try {
			await onExpenseCompleted(db, {
				id: exp.id, organizationId, category: exp.category, amount: exp.amount, date: exp.date,
				description: exp.description || exp.category, sourceAccountId: exp.sourceAccountId,
				projectId: exp.projectId, sourceType: exp.sourceType,
			});
			// The hook returns void and silently skips when accounts are missing or
			// the period is closed — verify an entry actually landed before counting
			// it as backfilled, so the summary can't overstate completeness.
			if (await hasEntry("EXPENSE", exp.id)) {
				r.expenses++;
			} else {
				r.errors.push({ type: "EXPENSE", id: exp.id, error: "skipped — missing accounts or closed period" });
			}
		} catch (e: any) { r.errors.push({ type: "EXPENSE", id: exp.id, error: e.message }); }
	}

	// --- 5. Completed Transfers ---
	const transfers = await db.financeTransfer.findMany({
		where: { organizationId, status: "COMPLETED" },
		select: { id: true, amount: true, date: true, description: true, fromAccountId: true, toAccountId: true },
	});
	for (const tr of transfers) {
		if (await hasEntry("TRANSFER", tr.id)) continue;
		try {
			await onTransferCompleted(db, {
				id: tr.id, organizationId, amount: tr.amount, date: tr.date,
				fromAccountId: tr.fromAccountId, toAccountId: tr.toAccountId, description: tr.description ?? undefined,
			});
			r.transfers++;
		} catch (e: any) { r.errors.push({ type: "TRANSFER", id: tr.id, error: e.message }); }
	}

	// --- 6. Subcontract Payments ---
	const subPays = await db.subcontractPayment.findMany({
		where: { organizationId },
		include: { contract: { select: { name: true, projectId: true } } },
	});
	for (const sp of subPays) {
		if (await hasEntry("SUBCONTRACT_PAYMENT", sp.id)) continue;
		try {
			await onSubcontractPayment(db, {
				id: sp.id, organizationId, contractorName: sp.contract.name,
				amount: sp.amount, date: sp.date, sourceAccountId: sp.sourceAccountId || "",
				projectId: sp.contract.projectId, claimId: sp.claimId,
			});
			r.subcontractPayments++;
		} catch (e: any) { r.errors.push({ type: "SUBCONTRACT_PAYMENT", id: sp.id, error: e.message }); }
	}

	// --- 7. Approved Claims (accrual entries) ---
	const claims = await db.subcontractClaim.findMany({
		where: { organizationId, status: { in: ["APPROVED", "PARTIALLY_PAID", "PAID"] } },
		include: { contract: { select: { name: true, projectId: true } } },
	});
	for (const cl of claims) {
		if (await hasEntry("SUBCONTRACT_CLAIM_APPROVED", cl.id)) continue;
		try {
			await onSubcontractClaimApproved(db, {
				id: cl.id, organizationId, claimNo: cl.claimNo, contractorName: cl.contract.name,
				netAmount: cl.netAmount, date: cl.approvedAt || cl.createdAt, projectId: cl.contract.projectId,
			});
			r.claimsApproved++;
		} catch (e: any) { r.errors.push({ type: "CLAIM_APPROVED", id: `CLM-${cl.claimNo}`, error: e.message }); }
	}

	// --- 8. Payroll Runs (APPROVED or PAID) ---
	const payrolls = await db.payrollRun.findMany({
		where: { organizationId, status: { in: ["APPROVED", "PAID"] } },
		include: { items: { select: { gosiDeduction: true } } },
	});
	for (const pr of payrolls) {
		if (await hasEntry("PAYROLL", pr.id)) continue;
		try {
			const totalGosi = pr.items.reduce(
				(sum: Prisma.Decimal, item: any) => sum.add(item.gosiDeduction || new Prisma.Decimal(0)),
				new Prisma.Decimal(0),
			);
			await onPayrollApproved(db, {
				id: pr.id, organizationId, month: pr.month, year: pr.year,
				totalNet: pr.totalNetSalary, totalGosi,
			});
			r.payroll++;
		} catch (e: any) { r.errors.push({ type: "PAYROLL", id: `${pr.month}/${pr.year}`, error: e.message }); }
	}

	// --- 9. Direct Receipts (FinancePayment) ---
	const orgPays = await db.financePayment.findMany({
		where: { organizationId },
		select: { id: true, amount: true, date: true, description: true, destinationAccountId: true, projectId: true },
	});
	for (const op of orgPays) {
		if (await hasEntry("ORG_PAYMENT", op.id)) continue;
		try {
			await onOrganizationPaymentReceived(db, {
				id: op.id, organizationId, amount: op.amount, date: op.date,
				description: op.description || "", destinationAccountId: op.destinationAccountId, projectId: op.projectId,
			});
			r.orgPayments++;
		} catch (e: any) { r.errors.push({ type: "ORG_PAYMENT", id: op.id, error: e.message }); }
	}

	// --- 10. Project Payments ---
	const projPays = await db.projectPayment.findMany({
		where: { organizationId },
		select: { id: true, amount: true, date: true, destinationAccountId: true, projectId: true, paymentNo: true },
	});
	for (const pp of projPays) {
		if (await hasEntry("PROJECT_PAYMENT", pp.id)) continue;
		try {
			await onProjectPaymentReceived(db, {
				id: pp.id, organizationId, amount: pp.amount, date: pp.date,
				destinationAccountId: pp.destinationAccountId || "", projectId: pp.projectId, paymentNo: pp.paymentNo,
			});
			r.projectPayments++;
		} catch (e: any) { r.errors.push({ type: "PROJECT_PAYMENT", id: pp.paymentNo, error: e.message }); }
	}

	// --- 11. Approved Project Claims (accrual — revenue recognition) ---
	const projectClaims = await db.projectClaim.findMany({
		where: { organizationId, status: { in: ["APPROVED", "PAID"] } },
		include: { project: { select: { clientName: true } } },
	});
	for (const pc of projectClaims) {
		if (await hasEntry("PROJECT_CLAIM_APPROVED", pc.id)) continue;
		try {
			await onProjectClaimApproved(db, {
				id: pc.id, organizationId, claimNo: pc.claimNo,
				clientName: pc.project.clientName || "",
				netAmount: pc.amount, date: pc.approvedAt || pc.createdAt, projectId: pc.projectId,
			});
			r.projectClaimsApproved++;
		} catch (e: any) { r.errors.push({ type: "PROJECT_CLAIM_APPROVED", id: `PCLM-${pc.claimNo}`, error: e.message }); }
	}

	// --- 11b. Repair project payment entries credited to the wrong side ---
	// Payments journaled before the cash-basis fix always credited 1120 even on
	// never-billed projects; re-align every entry with the current billing state.
	if (userId) {
		try {
			const { reconcileProjectPaymentEntries } = await import("./reconcile-project-payments");
			const rec = await reconcileProjectPaymentEntries(db, { organizationId, userId });
			r.projectPaymentsRepaired = rec.repaired;
			for (const err of rec.errors) {
				r.errors.push({ type: "PROJECT_PAYMENT_REPAIR", id: err.paymentNo, error: err.error });
			}
		} catch (e: any) { r.errors.push({ type: "PROJECT_PAYMENT_REPAIR", id: "*", error: e.message }); }
	}

	// --- 12. Owner Drawings (APPROVED) → DR 34xx / CR Bank ---
	const drawings = await db.ownerDrawing.findMany({
		where: { organizationId, status: "APPROVED" },
		select: {
			id: true, drawingNo: true, amount: true, date: true,
			bankAccountId: true, projectId: true, createdById: true,
			owner: { select: { id: true, name: true, nameEn: true, drawingsAccountId: true } },
			project: { select: { name: true } },
		},
	});
	for (const d of drawings) {
		if (await hasEntry("OWNER_DRAWING", d.id)) continue;
		try {
			// Ensure the owner has a 34xx drawings sub-account (mirrors live flow)
			let drawingsAccountId = d.owner.drawingsAccountId;
			if (!drawingsAccountId) {
				drawingsAccountId = await createOwnerDrawingAccount(
					db, organizationId, d.owner.name, d.owner.nameEn ?? undefined,
				);
				if (drawingsAccountId) {
					await db.organizationOwner.update({
						where: { id: d.owner.id },
						data: { drawingsAccountId },
					});
				}
			}
			if (!drawingsAccountId) {
				r.errors.push({ type: "OWNER_DRAWING", id: d.drawingNo, error: "no drawings account" });
				continue;
			}
			const jeId = await onOwnerDrawing(db, {
				id: d.id, organizationId, drawingNo: d.drawingNo, amount: d.amount, date: d.date,
				ownerName: d.owner.name, drawingsAccountId, bankAccountId: d.bankAccountId,
				projectId: d.projectId, projectName: d.project?.name ?? null, userId: d.createdById,
			});
			if (jeId) {
				await db.ownerDrawing.update({ where: { id: d.id }, data: { journalEntryId: jeId } });
				r.ownerDrawings++;
			}
		} catch (e: any) { r.errors.push({ type: "OWNER_DRAWING", id: d.drawingNo, error: e.message }); }
	}

	// --- 13. Capital Contributions (ACTIVE) → DR Bank / CR 3100 ---
	const contributions = await db.capitalContribution.findMany({
		where: { organizationId, status: "ACTIVE" },
		select: {
			id: true, contributionNo: true, amount: true, date: true, type: true,
			bankAccountId: true, createdById: true,
			owner: { select: { name: true } },
		},
	});
	for (const c of contributions) {
		if (await hasEntry("CAPITAL_CONTRIBUTION", c.id)) continue;
		try {
			const jeId = await onCapitalContribution(db, {
				id: c.id, organizationId, contributionNo: c.contributionNo, amount: c.amount, date: c.date,
				ownerName: c.owner.name, type: c.type, bankAccountId: c.bankAccountId, userId: c.createdById,
			});
			if (jeId) {
				await db.capitalContribution.update({ where: { id: c.id }, data: { journalEntryId: jeId } });
				r.capitalContributions++;
			}
		} catch (e: any) { r.errors.push({ type: "CAPITAL_CONTRIBUTION", id: c.contributionNo, error: e.message }); }
	}

	r.total = r.invoices + r.invoicePayments + r.expenses + r.transfers +
		r.subcontractPayments + r.payroll + r.orgPayments + r.creditNotes +
		r.projectPayments + r.projectPaymentsRepaired + r.claimsApproved +
		r.projectClaimsApproved + r.ownerDrawings + r.capitalContributions;

	return r;
}

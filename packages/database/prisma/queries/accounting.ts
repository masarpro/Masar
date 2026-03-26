// Accounting Module — Chart of Accounts + Journal Entries
// Uses ChartAccount (not Account, which is Better Auth's OAuth model)

import { type PrismaClient, Prisma, type ChartAccountType, type NormalBalance } from "../generated/client";
import { nextSequenceValue, formatSequenceNo } from "./sequences";

// ========================================
// Default Chart of Accounts for Saudi Construction Companies
// ========================================

interface DefaultAccount {
	code: string;
	nameAr: string;
	nameEn: string;
	type: ChartAccountType;
	normalBalance: NormalBalance;
	level: number;
	parentCode: string | null;
	isSystem: boolean;
	isPostable: boolean;
}

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccount[] = [
	// 1000 — Assets
	{ code: "1000", nameAr: "الأصول", nameEn: "Assets", type: "ASSET", normalBalance: "DEBIT", level: 1, parentCode: null, isSystem: true, isPostable: false },

	// 1100 — Current Assets
	{ code: "1100", nameAr: "الأصول المتداولة", nameEn: "Current Assets", type: "ASSET", normalBalance: "DEBIT", level: 2, parentCode: "1000", isSystem: true, isPostable: false },
	{ code: "1110", nameAr: "النقدية والبنوك", nameEn: "Cash & Banks", type: "ASSET", normalBalance: "DEBIT", level: 3, parentCode: "1100", isSystem: true, isPostable: false },
	{ code: "1120", nameAr: "العملاء — الذمم المدينة", nameEn: "Accounts Receivable", type: "ASSET", normalBalance: "DEBIT", level: 3, parentCode: "1100", isSystem: true, isPostable: true },
	{ code: "1130", nameAr: "دفعات مقدمة", nameEn: "Prepayments", type: "ASSET", normalBalance: "DEBIT", level: 3, parentCode: "1100", isSystem: true, isPostable: true },
	{ code: "1140", nameAr: "مخزون مواد", nameEn: "Materials Inventory", type: "ASSET", normalBalance: "DEBIT", level: 3, parentCode: "1100", isSystem: false, isPostable: true },
	{ code: "1150", nameAr: "ضريبة مدخلات قابلة للاسترداد", nameEn: "Input VAT Recoverable", type: "ASSET", normalBalance: "DEBIT", level: 3, parentCode: "1100", isSystem: true, isPostable: true },

	// 1200 — Fixed Assets
	{ code: "1200", nameAr: "الأصول الثابتة", nameEn: "Fixed Assets", type: "ASSET", normalBalance: "DEBIT", level: 2, parentCode: "1000", isSystem: true, isPostable: false },
	{ code: "1210", nameAr: "معدات وآليات", nameEn: "Equipment & Machinery", type: "ASSET", normalBalance: "DEBIT", level: 3, parentCode: "1200", isSystem: false, isPostable: true },
	{ code: "1220", nameAr: "سيارات ومركبات", nameEn: "Vehicles", type: "ASSET", normalBalance: "DEBIT", level: 3, parentCode: "1200", isSystem: false, isPostable: true },
	{ code: "1230", nameAr: "أثاث ومعدات مكتبية", nameEn: "Furniture & Office Equipment", type: "ASSET", normalBalance: "DEBIT", level: 3, parentCode: "1200", isSystem: false, isPostable: true },
	{ code: "1290", nameAr: "مجمع الإهلاك", nameEn: "Accumulated Depreciation", type: "ASSET", normalBalance: "CREDIT", level: 3, parentCode: "1200", isSystem: true, isPostable: true },

	// 2000 — Liabilities
	{ code: "2000", nameAr: "الخصوم", nameEn: "Liabilities", type: "LIABILITY", normalBalance: "CREDIT", level: 1, parentCode: null, isSystem: true, isPostable: false },

	{ code: "2100", nameAr: "الخصوم المتداولة", nameEn: "Current Liabilities", type: "LIABILITY", normalBalance: "CREDIT", level: 2, parentCode: "2000", isSystem: true, isPostable: false },
	{ code: "2110", nameAr: "الموردون — الذمم الدائنة", nameEn: "Accounts Payable", type: "LIABILITY", normalBalance: "CREDIT", level: 3, parentCode: "2100", isSystem: true, isPostable: true },
	{ code: "2120", nameAr: "مستحقات مقاولي الباطن", nameEn: "Subcontractor Payables", type: "LIABILITY", normalBalance: "CREDIT", level: 3, parentCode: "2100", isSystem: true, isPostable: true },
	{ code: "2130", nameAr: "ضريبة القيمة المضافة المستحقة", nameEn: "VAT Payable", type: "LIABILITY", normalBalance: "CREDIT", level: 3, parentCode: "2100", isSystem: true, isPostable: true },
	{ code: "2140", nameAr: "رواتب وأجور مستحقة", nameEn: "Salaries Payable", type: "LIABILITY", normalBalance: "CREDIT", level: 3, parentCode: "2100", isSystem: true, isPostable: true },
	{ code: "2150", nameAr: "احتفاظات وضمانات", nameEn: "Retentions Payable", type: "LIABILITY", normalBalance: "CREDIT", level: 3, parentCode: "2100", isSystem: true, isPostable: true },
	{ code: "2160", nameAr: "دفعات مقدمة من عملاء", nameEn: "Advance Payments from Clients", type: "LIABILITY", normalBalance: "CREDIT", level: 3, parentCode: "2100", isSystem: true, isPostable: true },
	{ code: "2170", nameAr: "تأمينات اجتماعية مستحقة", nameEn: "GOSI Payable", type: "LIABILITY", normalBalance: "CREDIT", level: 3, parentCode: "2100", isSystem: true, isPostable: true },

	// 3000 — Equity
	{ code: "3000", nameAr: "حقوق الملكية", nameEn: "Equity", type: "EQUITY", normalBalance: "CREDIT", level: 1, parentCode: null, isSystem: true, isPostable: false },
	{ code: "3100", nameAr: "رأس المال", nameEn: "Capital", type: "EQUITY", normalBalance: "CREDIT", level: 2, parentCode: "3000", isSystem: true, isPostable: true },
	{ code: "3200", nameAr: "أرباح مبقاة", nameEn: "Retained Earnings", type: "EQUITY", normalBalance: "CREDIT", level: 2, parentCode: "3000", isSystem: true, isPostable: true },
	{ code: "3300", nameAr: "أرباح / خسائر العام الحالي", nameEn: "Current Year P&L", type: "EQUITY", normalBalance: "CREDIT", level: 2, parentCode: "3000", isSystem: true, isPostable: false },

	// 4000 — Revenue
	{ code: "4000", nameAr: "الإيرادات", nameEn: "Revenue", type: "REVENUE", normalBalance: "CREDIT", level: 1, parentCode: null, isSystem: true, isPostable: false },
	{ code: "4100", nameAr: "إيرادات المشاريع", nameEn: "Project Revenue", type: "REVENUE", normalBalance: "CREDIT", level: 2, parentCode: "4000", isSystem: true, isPostable: true },
	{ code: "4200", nameAr: "إيرادات أوامر التغيير", nameEn: "Change Order Revenue", type: "REVENUE", normalBalance: "CREDIT", level: 2, parentCode: "4000", isSystem: false, isPostable: true },
	{ code: "4300", nameAr: "إيرادات أخرى", nameEn: "Other Revenue", type: "REVENUE", normalBalance: "CREDIT", level: 2, parentCode: "4000", isSystem: false, isPostable: true },

	// 5000 — Cost of Projects
	{ code: "5000", nameAr: "تكاليف المشاريع", nameEn: "Cost of Projects", type: "EXPENSE", normalBalance: "DEBIT", level: 1, parentCode: null, isSystem: true, isPostable: false },
	{ code: "5100", nameAr: "مواد ومشتريات", nameEn: "Materials & Purchases", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "5000", isSystem: true, isPostable: true },
	{ code: "5200", nameAr: "مقاولو باطن", nameEn: "Subcontractors", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "5000", isSystem: true, isPostable: true },
	{ code: "5300", nameAr: "عمالة مباشرة", nameEn: "Direct Labor", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "5000", isSystem: true, isPostable: true },
	{ code: "5400", nameAr: "معدات وآليات مشاريع", nameEn: "Project Equipment Costs", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "5000", isSystem: false, isPostable: true },
	{ code: "5500", nameAr: "تكاليف مشاريع أخرى", nameEn: "Other Project Costs", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "5000", isSystem: false, isPostable: true },

	// 6000 — Operating Expenses
	{ code: "6000", nameAr: "المصروفات التشغيلية", nameEn: "Operating Expenses", type: "EXPENSE", normalBalance: "DEBIT", level: 1, parentCode: null, isSystem: true, isPostable: false },
	{ code: "6100", nameAr: "رواتب وأجور إدارية", nameEn: "Administrative Salaries", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: true, isPostable: true },
	{ code: "6200", nameAr: "إيجارات", nameEn: "Rent", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: true, isPostable: true },
	{ code: "6300", nameAr: "مرافق واتصالات", nameEn: "Utilities & Communications", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: true, isPostable: true },
	{ code: "6400", nameAr: "نقل ومواصلات", nameEn: "Transportation", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: false, isPostable: true },
	{ code: "6500", nameAr: "تأمين", nameEn: "Insurance", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: false, isPostable: true },
	{ code: "6600", nameAr: "رسوم حكومية وتراخيص", nameEn: "Government Fees & Licenses", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: false, isPostable: true },
	{ code: "6700", nameAr: "صيانة", nameEn: "Maintenance", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: false, isPostable: true },
	{ code: "6800", nameAr: "تسويق وإعلان", nameEn: "Marketing & Advertising", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: false, isPostable: true },
	{ code: "6900", nameAr: "مصروفات إدارية أخرى", nameEn: "Other Admin Expenses", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: false, isPostable: true },
	{ code: "6950", nameAr: "عمولات ورسوم بنكية", nameEn: "Bank Charges & Fees", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: true, isPostable: true },
	{ code: "6960", nameAr: "غرامات وجزاءات", nameEn: "Fines & Penalties", type: "EXPENSE", normalBalance: "DEBIT", level: 2, parentCode: "6000", isSystem: false, isPostable: true },
];

// ========================================
// Expense Category → Account Code Mapping
// ========================================

export const EXPENSE_CATEGORY_TO_ACCOUNT_CODE: Record<string, string> = {
	MATERIALS: "5100",
	EQUIPMENT_RENTAL: "5400",
	LABOR: "5300",
	CONCRETE: "5100",
	STEEL: "5100",
	ELECTRICAL: "5500",
	PLUMBING: "5500",
	HVAC: "5500",
	PAINTING: "5500",
	FINISHING: "5500",
	EXCAVATION: "5500",
	SAFETY: "5500",
	TESTING: "5500",
	RENT: "6200",
	UTILITIES: "6300",
	COMMUNICATIONS: "6300",
	INSURANCE: "6500",
	LICENSES: "6600",
	GOVERNMENT_FEES: "6600",
	MAINTENANCE: "6700",
	OFFICE_SUPPLIES: "6900",
	TRAVEL: "6400",
	TRANSPORTATION: "6400",
	TRANSPORT: "6400",
	SUBSCRIPTIONS: "6900",
	LEGAL: "6900",
	MARKETING: "6800",
	BANK_FEES: "6950",
	FINES: "6960",
	SALARY: "6100",
	SALARIES: "6100",
	EQUIPMENT_PURCHASE: "5400",
	SUBCONTRACTOR: "5200",
	FUEL: "6400",
	SUPPLIES: "6900",
	TRAINING: "6900",
	HOSPITALITY: "6900",
	LOAN_PAYMENT: "2110",
	TAXES: "6600",
	ZAKAT: "6600",
	REFUND: "4300",
	CUSTOM: "6900",
	MISC: "6900",
	OTHER: "6900",
};

// System account codes used by auto-journal engine
export const SYSTEM_ACCOUNTS = {
	ACCOUNTS_RECEIVABLE: "1120",
	INPUT_VAT: "1150",
	ACCOUNTS_PAYABLE: "2110",
	SUBCONTRACTOR_PAYABLES: "2120",
	VAT_PAYABLE: "2130",
	SALARIES_PAYABLE: "2140",
	GOSI_PAYABLE: "2170",
	PROJECT_REVENUE: "4100",
	OTHER_REVENUE: "4300",
	SUBCONTRACTORS: "5200",
	ADMIN_SALARIES: "6100",
} as const;

// ========================================
// Seed Chart of Accounts
// ========================================

export async function seedChartOfAccounts(
	db: PrismaClient,
	organizationId: string,
): Promise<{ created: number; skipped: number }> {
	const existingCount = await db.chartAccount.count({ where: { organizationId } });
	if (existingCount > 0) {
		return { created: 0, skipped: existingCount };
	}

	// Phase A: Create all accounts without parentId
	const accountMap = new Map<string, string>(); // code → id

	for (const acc of DEFAULT_CHART_OF_ACCOUNTS) {
		const created = await db.chartAccount.create({
			data: {
				organizationId,
				code: acc.code,
				nameAr: acc.nameAr,
				nameEn: acc.nameEn,
				type: acc.type,
				normalBalance: acc.normalBalance,
				level: acc.level,
				isSystem: acc.isSystem,
				isPostable: acc.isPostable,
			},
		});
		accountMap.set(acc.code, created.id);
	}

	// Phase B: Link parents
	for (const acc of DEFAULT_CHART_OF_ACCOUNTS) {
		if (acc.parentCode) {
			const parentId = accountMap.get(acc.parentCode);
			const accountId = accountMap.get(acc.code);
			if (parentId && accountId) {
				await db.chartAccount.update({
					where: { id: accountId },
					data: { parentId },
				});
			}
		}
	}

	// Phase C: Create sub-accounts for existing bank accounts under 1110
	const bankAccounts = await db.organizationBank.findMany({
		where: { organizationId },
		select: { id: true, name: true },
	});

	const cashParentId = accountMap.get("1110");
	if (cashParentId && bankAccounts.length > 0) {
		for (let i = 0; i < bankAccounts.length; i++) {
			const bankCode = `11${(i + 1).toString().padStart(2, "0")}`;
			const bankChartAccount = await db.chartAccount.create({
				data: {
					organizationId,
					code: bankCode,
					nameAr: bankAccounts[i].name,
					nameEn: bankAccounts[i].name,
					type: "ASSET",
					normalBalance: "DEBIT",
					level: 4,
					parentId: cashParentId,
					isSystem: false,
					isPostable: true,
				},
			});

			await db.organizationBank.update({
				where: { id: bankAccounts[i].id },
				data: { chartAccountId: bankChartAccount.id },
			});
		}
	}

	return { created: DEFAULT_CHART_OF_ACCOUNTS.length + bankAccounts.length, skipped: 0 };
}

/**
 * Create a chart account for a new bank account (if accounting enabled)
 */
export async function createBankChartAccount(
	db: PrismaClient,
	organizationId: string,
	bankId: string,
	bankName: string,
): Promise<string | null> {
	// Check if accounting is enabled (1110 parent exists)
	const cashParent = await db.chartAccount.findUnique({
		where: { organizationId_code: { organizationId, code: "1110" } },
		select: { id: true },
	});
	if (!cashParent) return null;

	// Find next available code under 1110
	const lastChild = await db.chartAccount.findFirst({
		where: { organizationId, parentId: cashParent.id },
		orderBy: { code: "desc" },
		select: { code: true },
	});

	let nextCode: string;
	if (lastChild) {
		const lastNum = parseInt(lastChild.code, 10);
		nextCode = (lastNum + 1).toString().padStart(4, "0");
	} else {
		nextCode = "1101";
	}

	const newAccount = await db.chartAccount.create({
		data: {
			organizationId,
			code: nextCode,
			nameAr: bankName,
			nameEn: bankName,
			type: "ASSET",
			normalBalance: "DEBIT",
			level: 4,
			parentId: cashParent.id,
			isSystem: false,
			isPostable: true,
		},
	});

	await db.organizationBank.update({
		where: { id: bankId },
		data: { chartAccountId: newAccount.id },
	});

	return newAccount.id;
}

// ========================================
// Chart of Accounts Queries
// ========================================

export async function getChartOfAccounts(db: PrismaClient, organizationId: string) {
	return db.chartAccount.findMany({
		where: { organizationId },
		orderBy: { code: "asc" },
		select: {
			id: true,
			code: true,
			nameAr: true,
			nameEn: true,
			type: true,
			normalBalance: true,
			level: true,
			parentId: true,
			isSystem: true,
			isActive: true,
			isPostable: true,
		},
	});
}

export async function getChartAccountById(db: PrismaClient, accountId: string, organizationId?: string) {
	return db.chartAccount.findFirst({
		where: { id: accountId, ...(organizationId ? { organizationId } : {}) },
		include: {
			parent: { select: { id: true, code: true, nameAr: true, nameEn: true } },
			children: { select: { id: true, code: true, nameAr: true, nameEn: true, isActive: true }, orderBy: { code: "asc" } },
			bankAccount: { select: { id: true, name: true } },
		},
	});
}

// ========================================
// Journal Entry Queries
// ========================================

const ZERO = new Prisma.Decimal(0);

export async function createJournalEntry(db: PrismaClient, data: {
	organizationId: string;
	date: Date;
	description: string;
	referenceType?: string;
	referenceId?: string;
	referenceNo?: string;
	isAutoGenerated: boolean;
	lines: { accountId: string; debit: Prisma.Decimal; credit: Prisma.Decimal; description?: string; projectId?: string | null }[];
	createdById?: string;
}) {
	// Validations
	if (data.lines.length < 2) {
		throw new Error("Journal entry must have at least 2 lines");
	}

	const totalDebit = data.lines.reduce((sum, l) => sum.add(l.debit), ZERO);
	const totalCredit = data.lines.reduce((sum, l) => sum.add(l.credit), ZERO);

	if (!totalDebit.equals(totalCredit)) {
		throw new Error(`Journal entry is not balanced: debit=${totalDebit} credit=${totalCredit}`);
	}

	// Check for duplicate auto-generated entries
	if (data.isAutoGenerated && data.referenceType && data.referenceId) {
		const existing = await db.journalEntry.findFirst({
			where: {
				organizationId: data.organizationId,
				referenceType: data.referenceType,
				referenceId: data.referenceId,
				status: { not: "REVERSED" },
			},
		});
		if (existing) return existing;
	}

	// Check if the entry date falls in a closed period
	const periodClosed = await isPeriodClosed(db, data.organizationId, data.date);
	if (periodClosed) {
		if (data.isAutoGenerated) {
			console.warn(`[AutoJournal] Skipped — period closed for date ${data.date.toISOString()} | ref: ${data.referenceType}/${data.referenceId}`);
			// Log to audit trail if userId available
			if (data.createdById) {
				db.organizationAuditLog.create({
					data: {
						organizationId: data.organizationId,
						actorId: data.createdById,
						action: "JOURNAL_ENTRY_SKIPPED",
						entityType: "journal_entry",
						entityId: data.referenceId ?? "",
						metadata: {
							referenceType: data.referenceType,
							referenceId: data.referenceId,
							date: data.date.toISOString(),
							reason: "period_closed",
						} as any,
					},
				}).catch(() => {});
			}
			return null;
		}
		throw new Error("لا يمكن إنشاء قيد في فترة محاسبية مغلقة");
	}

	// Validate all accounts exist and are postable
	const accountIds = [...new Set(data.lines.map((l) => l.accountId))];
	const accounts = await db.chartAccount.findMany({
		where: { id: { in: accountIds }, organizationId: data.organizationId },
		select: { id: true, isPostable: true, isActive: true },
	});

	if (accounts.length !== accountIds.length) {
		throw new Error("One or more accounts not found in this organization");
	}

	for (const acc of accounts) {
		if (!acc.isPostable) throw new Error(`Account ${acc.id} is not postable`);
		if (!acc.isActive) throw new Error(`Account ${acc.id} is not active`);
	}

	// Generate entry number with type-specific prefix
	const REFERENCE_TYPE_PREFIX: Record<string, string> = {
		INVOICE: "INV-JE",
		INVOICE_PAYMENT: "RCV-JE",
		EXPENSE: "EXP-JE",
		TRANSFER: "TRF-JE",
		SUBCONTRACT_PAYMENT: "SUB-JE",
		PROJECT_PAYMENT: "PRJ-JE",
		SUBCONTRACT_CLAIM_APPROVED: "SCL-JE",
		PROJECT_CLAIM_APPROVED: "PCL-JE",
		PAYROLL: "PAY-JE",
		ORG_PAYMENT: "RCV-JE",
		CREDIT_NOTE: "CN-JE",
		REVERSAL: "REV-JE",
		ADJUSTMENT: "ADJ-JE",
		PERIOD_CLOSING: "CLS-JE",
		OPENING_BALANCE: "OPN-JE",
		RECEIPT_VOUCHER: "RV-JE",
		PAYMENT_VOUCHER: "PV-JE",
		HANDOVER_RETENTION_RELEASE: "HR-JE",
	};
	const prefix = REFERENCE_TYPE_PREFIX[data.referenceType ?? ""] ?? "MAN-JE";
	const year = new Date().getFullYear();
	const seqValue = await nextSequenceValue(data.organizationId, `${prefix}-${year}`);
	const entryNo = formatSequenceNo(prefix, year, seqValue);

	// Auto-generated entries are posted immediately (they reflect real operations)
	// Manual entries start as DRAFT and need explicit posting
	const status = data.isAutoGenerated ? "POSTED" : "DRAFT";

	// Create entry with lines in a single transaction
	return db.journalEntry.create({
		data: {
			organizationId: data.organizationId,
			entryNo,
			date: data.date,
			description: data.description,
			referenceType: data.referenceType,
			referenceId: data.referenceId,
			referenceNo: data.referenceNo,
			isAutoGenerated: data.isAutoGenerated,
			status,
			...(data.isAutoGenerated ? { postedAt: new Date(), postedById: data.createdById } : {}),
			totalAmount: totalDebit,
			createdById: data.createdById,
			lines: {
				create: data.lines.map((l) => ({
					accountId: l.accountId,
					debit: l.debit,
					credit: l.credit,
					description: l.description,
					projectId: l.projectId ?? undefined,
				})),
			},
		},
		include: { lines: true },
	});
}

export async function postJournalEntry(db: PrismaClient, entryId: string, postedById: string) {
	const entry = await db.journalEntry.findUnique({ where: { id: entryId } });
	if (!entry) throw new Error("Journal entry not found");
	if (entry.status !== "DRAFT") throw new Error("Only draft entries can be posted");

	// Check if the entry date falls in a closed period
	const periodClosed = await isPeriodClosed(db, entry.organizationId, entry.date);
	if (periodClosed) {
		throw new Error("لا يمكن ترحيل قيد في فترة محاسبية مغلقة");
	}

	return db.journalEntry.update({
		where: { id: entryId },
		data: {
			status: "POSTED",
			postedById,
			postedAt: new Date(),
		},
	});
}

export async function reverseJournalEntry(db: PrismaClient, entryId: string, reversedById: string, date: Date) {
	const entry = await db.journalEntry.findUnique({
		where: { id: entryId },
		include: { lines: true },
	});
	if (!entry) throw new Error("Journal entry not found");
	if (entry.status !== "POSTED") throw new Error("Only posted entries can be reversed");

	// Check if the entry date falls in a closed period
	const periodClosed = await isPeriodClosed(db, entry.organizationId, entry.date);
	if (periodClosed) {
		throw new Error("لا يمكن عكس قيد في فترة محاسبية مغلقة");
	}

	// Create reversed entry
	const reversalEntry = await createJournalEntry(db, {
		organizationId: entry.organizationId,
		date,
		description: `عكس قيد: ${entry.description}`,
		referenceType: "REVERSAL",
		referenceId: entryId,
		referenceNo: entry.entryNo,
		isAutoGenerated: false,
		lines: entry.lines.map((l) => ({
			accountId: l.accountId,
			debit: l.credit, // swap
			credit: l.debit, // swap
			description: l.description ?? undefined,
			projectId: l.projectId,
		})),
		createdById: reversedById,
	});

	if (!reversalEntry) {
		throw new Error("لا يمكن عكس القيد — الفترة المحاسبية مغلقة");
	}

	// Post the reversal immediately
	await db.journalEntry.update({
		where: { id: reversalEntry.id },
		data: { status: "POSTED", postedById: reversedById, postedAt: new Date() },
	});

	// Mark original as reversed
	await db.journalEntry.update({
		where: { id: entryId },
		data: { isReversed: true, reversalId: reversalEntry.id, status: "REVERSED" },
	});

	return reversalEntry;
}

export async function getAccountBalance(
	db: PrismaClient,
	accountId: string,
	asOfDate?: Date,
): Promise<Prisma.Decimal> {
	const where: any = {
		accountId,
		journalEntry: { status: "POSTED" },
	};

	if (asOfDate) {
		where.journalEntry.date = { lte: asOfDate };
	}

	const result = await db.journalEntryLine.aggregate({
		where,
		_sum: { debit: true, credit: true },
	});

	const totalDebit = new Prisma.Decimal(Number(result._sum?.debit ?? 0));
	const totalCredit = new Prisma.Decimal(Number(result._sum?.credit ?? 0));

	return totalDebit.sub(totalCredit);
}

// ========================================
// Trial Balance (Enhanced — single SQL query)
// ========================================

export interface TrialBalanceRow {
	accountId: string;
	accountCode: string;
	accountNameAr: string;
	accountNameEn: string;
	accountType: ChartAccountType;
	normalBalance: string;
	level: number;
	parentCode: string | null;
	periodDebit: number;
	periodCredit: number;
	debitBalance: number;
	creditBalance: number;
	transactionCount: number;
	isSystem: boolean;
}

export interface TrialBalanceResult {
	rows: TrialBalanceRow[];
	totals: {
		totalPeriodDebit: number;
		totalPeriodCredit: number;
		totalDebitBalance: number;
		totalCreditBalance: number;
	};
	isBalanced: boolean;
	difference: number;
	asOfDate: Date;
	periodFrom: Date | null;
	accountCount: number;
	generatedAt: Date;
}

export async function getTrialBalance(
	db: PrismaClient,
	organizationId: string,
	options?: {
		asOfDate?: Date;
		dateFrom?: Date;
		includeZeroBalance?: boolean;
		level?: number;
		accountType?: ChartAccountType;
	},
): Promise<TrialBalanceResult> {
	const asOfDate = options?.asOfDate ?? new Date();
	const dateFrom = options?.dateFrom;

	// Single raw SQL query with GROUP BY for performance
	const results = await db.$queryRaw<Array<{
		accountId: string;
		totalDebit: string;
		totalCredit: string;
		txCount: string;
	}>>`
		SELECT
			jel."account_id" as "accountId",
			COALESCE(SUM(jel."debit"), 0)::text as "totalDebit",
			COALESCE(SUM(jel."credit"), 0)::text as "totalCredit",
			COUNT(DISTINCT jel."journal_entry_id")::text as "txCount"
		FROM "journal_entry_lines" jel
		INNER JOIN "journal_entries" je ON je."id" = jel."journal_entry_id"
		WHERE je."organization_id" = ${organizationId}
			AND je."status" = 'POSTED'
			AND je."date" <= ${asOfDate}
			${dateFrom ? Prisma.sql`AND je."date" >= ${dateFrom}` : Prisma.empty}
		GROUP BY jel."account_id"
	`;

	const balanceMap = new Map<string, { debit: number; credit: number; txCount: number }>();
	for (const r of results) {
		balanceMap.set(r.accountId, {
			debit: Number(r.totalDebit),
			credit: Number(r.totalCredit),
			txCount: Number(r.txCount),
		});
	}

	// Fetch accounts
	const accountWhere: any = { organizationId, isActive: true };
	if (!options?.includeZeroBalance) {
		accountWhere.id = { in: [...balanceMap.keys()] };
	}
	if (options?.level) accountWhere.level = options.level;
	if (options?.accountType) accountWhere.type = options.accountType;

	const accounts = await db.chartAccount.findMany({
		where: accountWhere,
		select: {
			id: true,
			code: true,
			nameAr: true,
			nameEn: true,
			type: true,
			normalBalance: true,
			level: true,
			isSystem: true,
			parent: { select: { code: true } },
		},
		orderBy: { code: "asc" },
	});

	const rows: TrialBalanceRow[] = [];
	let totalPeriodDebit = 0;
	let totalPeriodCredit = 0;
	let totalDebitBalance = 0;
	let totalCreditBalance = 0;

	for (const acc of accounts) {
		const data = balanceMap.get(acc.id) ?? { debit: 0, credit: 0, txCount: 0 };
		const net = data.debit - data.credit;

		if (!options?.includeZeroBalance && net === 0 && data.txCount === 0) continue;

		const row: TrialBalanceRow = {
			accountId: acc.id,
			accountCode: acc.code,
			accountNameAr: acc.nameAr,
			accountNameEn: acc.nameEn,
			accountType: acc.type,
			normalBalance: acc.normalBalance,
			level: acc.level,
			parentCode: acc.parent?.code ?? null,
			periodDebit: data.debit,
			periodCredit: data.credit,
			debitBalance: net > 0 ? net : 0,
			creditBalance: net < 0 ? Math.abs(net) : 0,
			transactionCount: data.txCount,
			isSystem: acc.isSystem,
		};

		rows.push(row);
		totalPeriodDebit += data.debit;
		totalPeriodCredit += data.credit;
		totalDebitBalance += row.debitBalance;
		totalCreditBalance += row.creditBalance;
	}

	const difference = Math.round((totalDebitBalance - totalCreditBalance) * 100) / 100;

	return {
		rows,
		totals: { totalPeriodDebit, totalPeriodCredit, totalDebitBalance, totalCreditBalance },
		isBalanced: Math.abs(difference) < 0.01,
		difference,
		asOfDate,
		periodFrom: dateFrom ?? null,
		accountCount: rows.length,
		generatedAt: new Date(),
	};
}

// ========================================
// Income Statement from Journal Entries
// ========================================

export interface IncomeStatementSection {
	code: string;
	nameAr: string;
	nameEn: string;
	accounts: {
		code: string;
		nameAr: string;
		nameEn: string;
		amount: number;
		percentage: number;
	}[];
	total: number;
}

export interface JournalIncomeStatementResult {
	period: { from: Date; to: Date };
	revenue: IncomeStatementSection;
	costOfProjects: IncomeStatementSection;
	grossProfit: number;
	grossProfitMargin: number;
	operatingExpenses: IncomeStatementSection;
	operatingProfit: number;
	operatingProfitMargin: number;
	netProfit: number;
	netProfitMargin: number;
	comparison?: {
		previousRevenue: number;
		previousCostOfProjects: number;
		previousGrossProfit: number;
		previousOperatingExpenses: number;
		previousNetProfit: number;
		revenueChangePercent: number;
		netProfitChangePercent: number;
	};
	generatedAt: Date;
}

export async function getJournalIncomeStatement(
	db: PrismaClient,
	organizationId: string,
	options: {
		dateFrom: Date;
		dateTo: Date;
		includeComparison?: boolean;
	},
): Promise<JournalIncomeStatementResult> {
	const balances = await db.$queryRaw<Array<{
		accountId: string;
		code: string;
		nameAr: string;
		nameEn: string;
		type: string;
		totalDebit: string;
		totalCredit: string;
	}>>`
		SELECT
			a."id" as "accountId", a."code", a."name_ar" as "nameAr", a."name_en" as "nameEn",
			a."type"::text,
			COALESCE(SUM(jel."debit"), 0)::text as "totalDebit",
			COALESCE(SUM(jel."credit"), 0)::text as "totalCredit"
		FROM "chart_accounts" a
		LEFT JOIN "journal_entry_lines" jel ON jel."account_id" = a."id"
		LEFT JOIN "journal_entries" je ON je."id" = jel."journal_entry_id"
			AND je."status" = 'POSTED'
			AND je."date" >= ${options.dateFrom}
			AND je."date" <= ${options.dateTo}
		WHERE a."organization_id" = ${organizationId}
			AND a."is_postable" = true
			AND a."is_active" = true
			AND a."type" IN ('REVENUE', 'EXPENSE')
		GROUP BY a."id"
		HAVING COALESCE(SUM(jel."debit"), 0) != 0 OR COALESCE(SUM(jel."credit"), 0) != 0
		ORDER BY a."code"
	`;

	// Separate into revenue (4xxx), cost of projects (5xxx), operating expenses (6xxx)
	const revenueAccounts: { code: string; nameAr: string; nameEn: string; amount: number }[] = [];
	const costAccounts: { code: string; nameAr: string; nameEn: string; amount: number }[] = [];
	const opexAccounts: { code: string; nameAr: string; nameEn: string; amount: number }[] = [];

	for (const b of balances) {
		const debit = Number(b.totalDebit);
		const credit = Number(b.totalCredit);

		if (b.type === "REVENUE") {
			const amount = credit - debit; // Revenue is credit-normal
			if (amount !== 0) revenueAccounts.push({ code: b.code, nameAr: b.nameAr, nameEn: b.nameEn, amount });
		} else if (b.type === "EXPENSE") {
			const amount = debit - credit; // Expense is debit-normal
			if (amount === 0) continue;
			if (b.code.startsWith("5")) {
				costAccounts.push({ code: b.code, nameAr: b.nameAr, nameEn: b.nameEn, amount });
			} else {
				opexAccounts.push({ code: b.code, nameAr: b.nameAr, nameEn: b.nameEn, amount });
			}
		}
	}

	const totalRevenue = revenueAccounts.reduce((s, a) => s + a.amount, 0);
	const totalCost = costAccounts.reduce((s, a) => s + a.amount, 0);
	const totalOpex = opexAccounts.reduce((s, a) => s + a.amount, 0);
	const grossProfit = totalRevenue - totalCost;
	const operatingProfit = grossProfit - totalOpex;
	const netProfit = operatingProfit;

	const pct = (amount: number) => totalRevenue > 0 ? Math.round((amount / totalRevenue) * 10000) / 100 : 0;

	const buildSection = (
		code: string, nameAr: string, nameEn: string,
		accounts: { code: string; nameAr: string; nameEn: string; amount: number }[],
	): IncomeStatementSection => ({
		code, nameAr, nameEn,
		accounts: accounts.map((a) => ({ ...a, percentage: pct(a.amount) })),
		total: accounts.reduce((s, a) => s + a.amount, 0),
	});

	let comparison: JournalIncomeStatementResult["comparison"];
	if (options.includeComparison) {
		const periodMs = options.dateTo.getTime() - options.dateFrom.getTime();
		const prevFrom = new Date(options.dateFrom.getTime() - periodMs - 86400000);
		const prevTo = new Date(options.dateFrom.getTime() - 86400000);
		const prev = await getJournalIncomeStatement(db, organizationId, {
			dateFrom: prevFrom, dateTo: prevTo, includeComparison: false,
		});
		comparison = {
			previousRevenue: prev.revenue.total,
			previousCostOfProjects: prev.costOfProjects.total,
			previousGrossProfit: prev.grossProfit,
			previousOperatingExpenses: prev.operatingExpenses.total,
			previousNetProfit: prev.netProfit,
			revenueChangePercent: prev.revenue.total > 0 ? Math.round(((totalRevenue - prev.revenue.total) / prev.revenue.total) * 10000) / 100 : 0,
			netProfitChangePercent: prev.netProfit !== 0 ? Math.round(((netProfit - prev.netProfit) / Math.abs(prev.netProfit)) * 10000) / 100 : 0,
		};
	}

	return {
		period: { from: options.dateFrom, to: options.dateTo },
		revenue: buildSection("4000", "الإيرادات", "Revenue", revenueAccounts),
		costOfProjects: buildSection("5000", "تكاليف المشاريع", "Cost of Projects", costAccounts),
		grossProfit,
		grossProfitMargin: pct(grossProfit),
		operatingExpenses: buildSection("6000", "المصروفات التشغيلية", "Operating Expenses", opexAccounts),
		operatingProfit,
		operatingProfitMargin: pct(operatingProfit),
		netProfit,
		netProfitMargin: pct(netProfit),
		comparison,
		generatedAt: new Date(),
	};
}

// ========================================
// Balance Sheet (Enhanced — single SQL query)
// ========================================

export interface AccountBalanceRow {
	accountId: string;
	code: string;
	nameAr: string;
	nameEn: string;
	balance: number;
}

export interface BalanceSheetResult {
	asOfDate: Date;
	assets: {
		currentAssets: { accounts: AccountBalanceRow[]; total: number };
		fixedAssets: { accounts: AccountBalanceRow[]; total: number };
		totalAssets: number;
	};
	liabilities: {
		currentLiabilities: { accounts: AccountBalanceRow[]; total: number };
		totalLiabilities: number;
	};
	equity: {
		accounts: AccountBalanceRow[];
		currentYearPL: number;
		totalEquity: number;
	};
	isBalanced: boolean;
}

export async function getBalanceSheet(
	db: PrismaClient,
	organizationId: string,
	asOfDate?: Date,
): Promise<BalanceSheetResult> {
	const date = asOfDate ?? new Date();
	const fiscalYearStart = new Date(date.getFullYear(), 0, 1);

	// Single raw SQL query for all balance sheet + P&L accounts
	const allBalances = await db.$queryRaw<Array<{
		accountId: string;
		code: string;
		nameAr: string;
		nameEn: string;
		type: string;
		normalBalance: string;
		totalDebit: string;
		totalCredit: string;
	}>>`
		SELECT
			a."id" as "accountId", a."code", a."name_ar" as "nameAr", a."name_en" as "nameEn",
			a."type"::text, a."normal_balance"::text as "normalBalance",
			COALESCE(SUM(jel."debit"), 0)::text as "totalDebit",
			COALESCE(SUM(jel."credit"), 0)::text as "totalCredit"
		FROM "chart_accounts" a
		LEFT JOIN "journal_entry_lines" jel ON jel."account_id" = a."id"
		LEFT JOIN "journal_entries" je ON je."id" = jel."journal_entry_id"
			AND je."status" = 'POSTED'
			AND je."date" <= ${date}
		WHERE a."organization_id" = ${organizationId}
			AND a."is_postable" = true
			AND a."is_active" = true
		GROUP BY a."id"
		HAVING COALESCE(SUM(jel."debit"), 0) != 0 OR COALESCE(SUM(jel."credit"), 0) != 0
		ORDER BY a."code"
	`;

	// Current year P&L (separate query with fiscal year filter)
	const plBalances = await db.$queryRaw<Array<{
		type: string;
		totalDebit: string;
		totalCredit: string;
	}>>`
		SELECT
			a."type"::text,
			COALESCE(SUM(jel."debit"), 0)::text as "totalDebit",
			COALESCE(SUM(jel."credit"), 0)::text as "totalCredit"
		FROM "chart_accounts" a
		INNER JOIN "journal_entry_lines" jel ON jel."account_id" = a."id"
		INNER JOIN "journal_entries" je ON je."id" = jel."journal_entry_id"
			AND je."status" = 'POSTED'
			AND je."date" >= ${fiscalYearStart}
			AND je."date" <= ${date}
		WHERE a."organization_id" = ${organizationId}
			AND a."type" IN ('REVENUE', 'EXPENSE')
		GROUP BY a."type"
	`;

	let plRevenue = 0;
	let plExpenses = 0;
	for (const pl of plBalances) {
		if (pl.type === "REVENUE") plRevenue = Number(pl.totalCredit) - Number(pl.totalDebit);
		if (pl.type === "EXPENSE") plExpenses = Number(pl.totalDebit) - Number(pl.totalCredit);
	}
	const currentYearPL = plRevenue - plExpenses;

	const toRow = (b: typeof allBalances[0]): AccountBalanceRow => {
		const debit = Number(b.totalDebit);
		const credit = Number(b.totalCredit);
		return {
			accountId: b.accountId,
			code: b.code,
			nameAr: b.nameAr,
			nameEn: b.nameEn,
			balance: b.normalBalance === "DEBIT" ? debit - credit : credit - debit,
		};
	};

	const bsAccounts = allBalances.filter((b) => ["ASSET", "LIABILITY", "EQUITY"].includes(b.type));
	const currentAssets = bsAccounts.filter((b) => b.type === "ASSET" && b.code.startsWith("11")).map(toRow).filter((r) => r.balance !== 0);
	const fixedAssets = bsAccounts.filter((b) => b.type === "ASSET" && b.code.startsWith("12")).map(toRow).filter((r) => r.balance !== 0);
	const liabilityRows = bsAccounts.filter((b) => b.type === "LIABILITY").map(toRow).filter((r) => r.balance !== 0);
	const equityRows = bsAccounts.filter((b) => b.type === "EQUITY").map(toRow).filter((r) => r.balance !== 0);

	const totalCurrentAssets = currentAssets.reduce((s, r) => s + r.balance, 0);
	const totalFixedAssets = fixedAssets.reduce((s, r) => s + r.balance, 0);
	const totalAssets = totalCurrentAssets + totalFixedAssets;
	const totalLiabilities = liabilityRows.reduce((s, r) => s + r.balance, 0);
	const totalEquityBase = equityRows.reduce((s, r) => s + r.balance, 0);
	const totalEquity = totalEquityBase + currentYearPL;

	return {
		asOfDate: date,
		assets: {
			currentAssets: { accounts: currentAssets, total: totalCurrentAssets },
			fixedAssets: { accounts: fixedAssets, total: totalFixedAssets },
			totalAssets,
		},
		liabilities: {
			currentLiabilities: { accounts: liabilityRows, total: totalLiabilities },
			totalLiabilities,
		},
		equity: {
			accounts: equityRows,
			currentYearPL,
			totalEquity,
		},
		isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
	};
}

// ========================================
// Period Closed Check
// ========================================

export async function isPeriodClosed(
	db: PrismaClient,
	organizationId: string,
	date: Date,
): Promise<boolean> {
	const closedPeriod = await db.accountingPeriod.findFirst({
		where: {
			organizationId,
			isClosed: true,
			startDate: { lte: date },
			endDate: { gte: date },
		},
	});
	return !!closedPeriod;
}

// ========================================
// Generate Monthly Periods
// ========================================

const MONTH_NAMES_AR = [
	"يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
	"يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export async function generateMonthlyPeriods(
	db: PrismaClient,
	organizationId: string,
	year: number,
): Promise<{ created: number }> {
	let created = 0;
	for (let m = 0; m < 12; m++) {
		const startDate = new Date(year, m, 1);
		const endDate = new Date(year, m + 1, 0);

		const exists = await db.accountingPeriod.findUnique({
			where: {
				organizationId_startDate_endDate: { organizationId, startDate, endDate },
			},
		});

		if (!exists) {
			await db.accountingPeriod.create({
				data: {
					organizationId,
					name: `${MONTH_NAMES_AR[m]} ${year}`,
					periodType: "MONTHLY",
					startDate,
					endDate,
				},
			});
			created++;
		}
	}
	return { created };
}

// ========================================
// Close Period
// ========================================

export async function closePeriod(
	db: PrismaClient,
	periodId: string,
	closedById: string,
	options?: { generateClosingEntry?: boolean },
): Promise<{ success: boolean; closingEntryId?: string }> {
	const period = await db.accountingPeriod.findUnique({ where: { id: periodId } });
	if (!period) throw new Error("الفترة غير موجودة");
	if (period.isClosed) throw new Error("الفترة مغلقة مسبقاً");

	// Check no draft entries in this period
	const draftEntries = await db.journalEntry.count({
		where: {
			organizationId: period.organizationId,
			status: "DRAFT",
			date: { gte: period.startDate, lte: period.endDate },
		},
	});
	if (draftEntries > 0) {
		throw new Error(`يوجد ${draftEntries} قيود مسودة في هذه الفترة. يجب ترحيلها أو حذفها أولاً.`);
	}

	let closingEntryId: string | undefined;

	if (options?.generateClosingEntry) {
		// Revenue accounts (credit-normal): balance = credits - debits
		const revenueAccounts = await db.$queryRaw<Array<{ id: string; code: string; nameAr: string; balance: string }>>`
			SELECT a."id", a."code", a."name_ar" as "nameAr",
				(COALESCE(SUM(jel."credit"), 0) - COALESCE(SUM(jel."debit"), 0))::text as "balance"
			FROM "chart_accounts" a
			INNER JOIN "journal_entry_lines" jel ON jel."account_id" = a."id"
			INNER JOIN "journal_entries" je ON je."id" = jel."journal_entry_id"
			WHERE a."organization_id" = ${period.organizationId}
				AND a."type" = 'REVENUE' AND a."is_postable" = true
				AND je."status" = 'POSTED'
				AND je."date" >= ${period.startDate} AND je."date" <= ${period.endDate}
			GROUP BY a."id"
			HAVING COALESCE(SUM(jel."credit"), 0) - COALESCE(SUM(jel."debit"), 0) != 0
		`;

		// Expense accounts (debit-normal): balance = debits - credits
		const expenseAccounts = await db.$queryRaw<Array<{ id: string; code: string; nameAr: string; balance: string }>>`
			SELECT a."id", a."code", a."name_ar" as "nameAr",
				(COALESCE(SUM(jel."debit"), 0) - COALESCE(SUM(jel."credit"), 0))::text as "balance"
			FROM "chart_accounts" a
			INNER JOIN "journal_entry_lines" jel ON jel."account_id" = a."id"
			INNER JOIN "journal_entries" je ON je."id" = jel."journal_entry_id"
			WHERE a."organization_id" = ${period.organizationId}
				AND a."type" = 'EXPENSE' AND a."is_postable" = true
				AND je."status" = 'POSTED'
				AND je."date" >= ${period.startDate} AND je."date" <= ${period.endDate}
			GROUP BY a."id"
			HAVING COALESCE(SUM(jel."debit"), 0) - COALESCE(SUM(jel."credit"), 0) != 0
		`;

		const ZERO_D = new Prisma.Decimal(0);
		const totalRevenue = revenueAccounts.reduce((s, a) => s.add(new Prisma.Decimal(a.balance)), ZERO_D);
		const totalExpenses = expenseAccounts.reduce((s, a) => s.add(new Prisma.Decimal(a.balance)), ZERO_D);
		const netProfit = totalRevenue.sub(totalExpenses);

		const retainedEarningsAcc = await db.chartAccount.findFirst({
			where: { organizationId: period.organizationId, code: "3200" },
			select: { id: true },
		});
		if (!retainedEarningsAcc) throw new Error("حساب الأرباح المبقاة (3200) غير موجود");

		const lines: any[] = [];

		// Zero out revenue: DR (reverse credit-normal)
		for (const rev of revenueAccounts) {
			const bal = new Prisma.Decimal(rev.balance);
			lines.push({ accountId: rev.id, debit: bal, credit: ZERO_D, description: `إقفال ${rev.nameAr}` });
		}

		// Zero out expenses: CR (reverse debit-normal)
		for (const exp of expenseAccounts) {
			const bal = new Prisma.Decimal(exp.balance);
			lines.push({ accountId: exp.id, debit: ZERO_D, credit: bal, description: `إقفال ${exp.nameAr}` });
		}

		// Net profit/loss → Retained Earnings (3200)
		if (netProfit.greaterThan(0)) {
			lines.push({ accountId: retainedEarningsAcc.id, debit: ZERO_D, credit: netProfit, description: "صافي ربح الفترة | Net profit" });
		} else if (netProfit.lessThan(0)) {
			lines.push({ accountId: retainedEarningsAcc.id, debit: netProfit.abs(), credit: ZERO_D, description: "صافي خسارة الفترة | Net loss" });
		}

		if (lines.length > 0) {
			const entry = await createJournalEntry(db, {
				organizationId: period.organizationId,
				date: period.endDate,
				description: `قيد إقفال ${period.name} | Closing entry for ${period.name}`,
				referenceType: "PERIOD_CLOSING",
				referenceId: period.id,
				isAutoGenerated: true,
				lines,
			});
			if (entry) closingEntryId = entry.id;
		}
	}

	await db.accountingPeriod.update({
		where: { id: periodId },
		data: {
			isClosed: true,
			closedAt: new Date(),
			closedById,
			...(closingEntryId ? { closingEntryId } : {}),
		},
	});

	return { success: true, closingEntryId };
}

// ========================================
// Reopen Period (last closed only)
// ========================================

export async function reopenPeriod(
	db: PrismaClient,
	periodId: string,
): Promise<void> {
	const period = await db.accountingPeriod.findUnique({ where: { id: periodId } });
	if (!period || !period.isClosed) throw new Error("الفترة غير مغلقة");

	const nextClosedPeriod = await db.accountingPeriod.findFirst({
		where: {
			organizationId: period.organizationId,
			isClosed: true,
			startDate: { gt: period.endDate },
		},
	});
	if (nextClosedPeriod) {
		throw new Error("لا يمكن إعادة فتح هذه الفترة لأن فترة لاحقة مغلقة");
	}

	await db.accountingPeriod.update({
		where: { id: periodId },
		data: { isClosed: false, closedAt: null, closedById: null },
	});
}

// ========================================
// Bulk Post Journal Entries (Feature 5)
// ========================================

export async function bulkPostJournalEntries(
	db: PrismaClient,
	organizationId: string,
	entryIds: string[],
	postedById: string,
): Promise<{ posted: number; errors: Array<{ entryId: string; entryNo: string; error: string }> }> {
	// Fetch all entries
	const entries = await db.journalEntry.findMany({
		where: { id: { in: entryIds }, organizationId },
	});

	// Fetch all closed periods for the org at once to avoid N+1
	const closedPeriods = await db.accountingPeriod.findMany({
		where: { organizationId, isClosed: true },
	});

	const errors: Array<{ entryId: string; entryNo: string; error: string }> = [];
	const validEntryIds: string[] = [];

	for (const entry of entries) {
		if (entry.status !== "DRAFT") {
			errors.push({ entryId: entry.id, entryNo: entry.entryNo, error: "القيد ليس مسودة" });
			continue;
		}
		// Check if entry date is in a closed period
		const inClosedPeriod = closedPeriods.some(
			(p) => entry.date >= p.startDate && entry.date <= p.endDate,
		);
		if (inClosedPeriod) {
			errors.push({ entryId: entry.id, entryNo: entry.entryNo, error: "القيد في فترة محاسبية مغلقة" });
			continue;
		}
		validEntryIds.push(entry.id);
	}

	// Batch update valid entries in a single transaction
	if (validEntryIds.length > 0) {
		await db.journalEntry.updateMany({
			where: { id: { in: validEntryIds } },
			data: {
				status: "POSTED",
				postedById,
				postedAt: new Date(),
			},
		});
	}

	return { posted: validEntryIds.length, errors };
}

export async function bulkPostAllDrafts(
	db: PrismaClient,
	organizationId: string,
	postedById: string,
): Promise<{ posted: number; errors: Array<{ entryId: string; entryNo: string; error: string }> }> {
	const draftEntries = await db.journalEntry.findMany({
		where: { organizationId, status: "DRAFT" },
		select: { id: true },
	});
	const ids = draftEntries.map((e) => e.id);
	if (ids.length === 0) return { posted: 0, errors: [] };
	return bulkPostJournalEntries(db, organizationId, ids, postedById);
}

// ========================================
// Account Ledger (Feature 1)
// ========================================

export interface LedgerEntry {
	date: Date;
	entryNo: string;
	entryId: string;
	description: string;
	referenceType: string | null;
	referenceNo: string | null;
	debit: number;
	credit: number;
	runningBalance: number;
}

export interface AccountLedgerResult {
	account: {
		id: string;
		code: string;
		nameAr: string;
		nameEn: string;
		type: ChartAccountType;
		normalBalance: NormalBalance;
	};
	openingBalance: number;
	entries: LedgerEntry[];
	closingBalance: number;
	totalDebit: number;
	totalCredit: number;
	total: number;
}

export async function getAccountLedger(
	db: PrismaClient,
	accountId: string,
	organizationId: string,
	options: {
		dateFrom?: Date;
		dateTo?: Date;
		page?: number;
		pageSize?: number;
	} = {},
): Promise<AccountLedgerResult> {
	const { dateFrom, dateTo, page = 1, pageSize = 50 } = options;

	// 1. Fetch account
	const account = await db.chartAccount.findFirst({
		where: { id: accountId, organizationId },
		select: { id: true, code: true, nameAr: true, nameEn: true, type: true, normalBalance: true },
	});
	if (!account) throw new Error("الحساب غير موجود");

	const isDebitNormal = account.normalBalance === "DEBIT";

	// 2. Calculate opening balance (all POSTED entries before dateFrom)
	let openingBalance = 0;
	if (dateFrom) {
		const openingAgg = await db.journalEntryLine.aggregate({
			where: {
				accountId,
				journalEntry: { organizationId, status: "POSTED", date: { lt: dateFrom } },
			},
			_sum: { debit: true, credit: true },
		});
		const totalDebit = Number(openingAgg._sum.debit ?? 0);
		const totalCredit = Number(openingAgg._sum.credit ?? 0);
		openingBalance = isDebitNormal ? totalDebit - totalCredit : totalCredit - totalDebit;
	}

	// 3. Build date filter
	const dateFilter: Record<string, Date> = {};
	if (dateFrom) dateFilter.gte = dateFrom;
	if (dateTo) dateFilter.lte = dateTo;

	const whereClause = {
		accountId,
		journalEntry: {
			organizationId,
			status: "POSTED" as const,
			...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
		},
	};

	// 4. Count total for pagination
	const total = await db.journalEntryLine.count({ where: whereClause });

	// 5. Fetch entries
	const lines = await db.journalEntryLine.findMany({
		where: whereClause,
		include: {
			journalEntry: {
				select: {
					id: true,
					entryNo: true,
					date: true,
					description: true,
					referenceType: true,
					referenceNo: true,
				},
			},
		},
		orderBy: [
			{ journalEntry: { date: "asc" } },
			{ journalEntry: { entryNo: "asc" } },
		],
		skip: (page - 1) * pageSize,
		take: pageSize,
	});

	// 6. Calculate running balance
	// For page > 1, we need the balance at the start of this page
	let pageOpeningBalance = openingBalance;
	if (page > 1 && lines.length > 0) {
		// Efficient approach: use aggregate with IDs from prior pages
		// Fetch just the IDs of prior page lines, then aggregate
		const priorIds = await db.journalEntryLine.findMany({
			where: whereClause,
			select: { id: true },
			orderBy: [
				{ journalEntry: { date: "asc" } },
				{ journalEntry: { entryNo: "asc" } },
			],
			take: (page - 1) * pageSize,
		});
		if (priorIds.length > 0) {
			const priorAgg = await db.journalEntryLine.aggregate({
				where: { id: { in: priorIds.map((p) => p.id) } },
				_sum: { debit: true, credit: true },
			});
			const priorDebit = Number(priorAgg._sum.debit ?? 0);
			const priorCredit = Number(priorAgg._sum.credit ?? 0);
			const priorSum = isDebitNormal ? priorDebit - priorCredit : priorCredit - priorDebit;
			pageOpeningBalance = openingBalance + priorSum;
		}
	}

	let runningBalance = pageOpeningBalance;
	let totalDebit = 0;
	let totalCredit = 0;

	const entries: LedgerEntry[] = lines.map((line) => {
		const d = Number(line.debit);
		const c = Number(line.credit);
		totalDebit += d;
		totalCredit += c;
		runningBalance += isDebitNormal ? d - c : c - d;

		return {
			date: line.journalEntry.date,
			entryNo: line.journalEntry.entryNo,
			entryId: line.journalEntry.id,
			description: line.journalEntry.description,
			referenceType: line.journalEntry.referenceType,
			referenceNo: line.journalEntry.referenceNo,
			debit: d,
			credit: c,
			runningBalance,
		};
	});

	return {
		account,
		openingBalance: page === 1 ? openingBalance : pageOpeningBalance,
		entries,
		closingBalance: runningBalance,
		totalDebit,
		totalCredit,
		total,
	};
}

// ========================================
// Opening Balances (Feature 2)
// ========================================

export async function getOpeningBalances(
	db: PrismaClient,
	organizationId: string,
): Promise<{
	entryId: string | null;
	entryDate: Date | null;
	accounts: Array<{
		accountId: string;
		code: string;
		nameAr: string;
		nameEn: string;
		type: ChartAccountType;
		normalBalance: NormalBalance;
		debit: number;
		credit: number;
	}>;
}> {
	// Find existing opening balance entry
	const existingEntry = await db.journalEntry.findFirst({
		where: { organizationId, referenceType: "OPENING_BALANCE" },
		include: {
			lines: {
				include: { account: { select: { id: true, code: true, nameAr: true, nameEn: true, type: true, normalBalance: true } } },
			},
		},
	});

	// Get all postable accounts
	const allAccounts = await db.chartAccount.findMany({
		where: { organizationId, isPostable: true, isActive: true },
		select: { id: true, code: true, nameAr: true, nameEn: true, type: true, normalBalance: true },
		orderBy: { code: "asc" },
	});

	if (existingEntry) {
		// Map existing lines to accounts, excluding the balancing entry (3200)
		const lineMap = new Map(
			existingEntry.lines.map((l) => [l.accountId, { debit: Number(l.debit), credit: Number(l.credit) }]),
		);

		return {
			entryId: existingEntry.id,
			entryDate: existingEntry.date,
			accounts: allAccounts.map((a) => ({
				accountId: a.id,
				code: a.code,
				nameAr: a.nameAr,
				nameEn: a.nameEn,
				type: a.type,
				normalBalance: a.normalBalance,
				debit: lineMap.get(a.id)?.debit ?? 0,
				credit: lineMap.get(a.id)?.credit ?? 0,
			})),
		};
	}

	return {
		entryId: null,
		entryDate: null,
		accounts: allAccounts.map((a) => ({
			accountId: a.id,
			code: a.code,
			nameAr: a.nameAr,
			nameEn: a.nameEn,
			type: a.type,
			normalBalance: a.normalBalance,
			debit: 0,
			credit: 0,
		})),
	};
}

export async function saveOpeningBalances(
	db: PrismaClient,
	organizationId: string,
	lines: Array<{ accountId: string; debit: number; credit: number }>,
	createdById: string,
	entryDate?: Date,
): Promise<{ entryId: string }> {
	// Filter out zero lines
	const nonZeroLines = lines.filter((l) => l.debit > 0 || l.credit > 0);
	if (nonZeroLines.length === 0) throw new Error("يجب إدخال رصيد واحد على الأقل");

	const totalDebit = nonZeroLines.reduce((sum, l) => sum + l.debit, 0);
	const totalCredit = nonZeroLines.reduce((sum, l) => sum + l.credit, 0);

	// Calculate the balancing amount for Retained Earnings (3200)
	const difference = totalDebit - totalCredit;
	const retainedEarningsAccount = await db.chartAccount.findFirst({
		where: { organizationId, code: "3200" },
	});
	if (!retainedEarningsAccount) throw new Error("حساب الأرباح المبقاة (3200) غير موجود");

	// Build final lines including balancing entry
	const finalLines: Array<{ accountId: string; debit: number; credit: number; description?: string }> = nonZeroLines.map((l) => ({
		accountId: l.accountId,
		debit: l.debit,
		credit: l.credit,
	}));

	if (Math.abs(difference) > 0.001) {
		finalLines.push({
			accountId: retainedEarningsAccount.id,
			debit: difference < 0 ? Math.abs(difference) : 0,
			credit: difference > 0 ? difference : 0,
			description: "رصيد موازنة — أرباح مبقاة",
		});
	}

	// Delete existing opening balance entry if any
	const existing = await db.journalEntry.findFirst({
		where: { organizationId, referenceType: "OPENING_BALANCE" },
	});
	if (existing) {
		await db.journalEntry.delete({ where: { id: existing.id } });
	}

	// Create new entry
	const date = entryDate ?? new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
	const entry = await createJournalEntry(db, {
		organizationId,
		date,
		description: "أرصدة افتتاحية",
		referenceType: "OPENING_BALANCE",
		isAutoGenerated: true, // auto-POSTED
		lines: finalLines.map((l) => ({
			accountId: l.accountId,
			debit: new Prisma.Decimal(l.debit),
			credit: new Prisma.Decimal(l.credit),
			description: l.description,
		})),
		createdById,
	});

	if (!entry) {
		throw new Error("لا يمكن حفظ الأرصدة الافتتاحية — الفترة المحاسبية مغلقة");
	}

	return { entryId: entry.id };
}

// ========================================
// Find Journal Entry by Reference (Feature 10)
// ========================================

export async function findJournalEntryByReference(
	db: PrismaClient,
	organizationId: string,
	referenceType: string,
	referenceId: string,
): Promise<{ id: string; entryNo: string } | null> {
	const entry = await db.journalEntry.findFirst({
		where: {
			organizationId,
			referenceType,
			referenceId,
			status: { not: "REVERSED" },
		},
		select: { id: true, entryNo: true },
		orderBy: { createdAt: "desc" },
	});
	return entry;
}

// ========================================
// Project Cost Center Report (Feature 6)
// ========================================

export interface CostCenterProject {
	projectId: string | null;
	projectName: string;
	accounts: Array<{ code: string; nameAr: string; type: string; amount: number }>;
	totalRevenue: number;
	totalExpenses: number;
	netProfit: number;
	profitMargin: number;
}

export interface CostCenterResult {
	projects: CostCenterProject[];
	totals: { totalRevenue: number; totalExpenses: number; netProfit: number };
}

export async function getCostCenterByProject(
	db: PrismaClient,
	organizationId: string,
	options: { dateFrom?: Date; dateTo?: Date; projectId?: string },
): Promise<CostCenterResult> {
	const dateFilter: Record<string, Date> = {};
	if (options.dateFrom) dateFilter.gte = options.dateFrom;
	if (options.dateTo) dateFilter.lte = options.dateTo;

	const lineWhere: any = {
		journalEntry: {
			organizationId,
			status: "POSTED",
			...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
		},
	};
	if (options.projectId) {
		lineWhere.projectId = options.projectId;
	}

	// Fetch all lines with project + account info
	const lines = await db.journalEntryLine.findMany({
		where: lineWhere,
		select: {
			projectId: true,
			debit: true,
			credit: true,
			account: {
				select: { code: true, nameAr: true, type: true },
			},
		},
	});

	// Fetch project names
	const projectIds = [...new Set(lines.map((l) => l.projectId).filter(Boolean))] as string[];
	const projects = await db.project.findMany({
		where: { id: { in: projectIds } },
		select: { id: true, name: true },
	});
	const projectMap = new Map(projects.map((p) => [p.id, p.name]));

	// Group by project → account
	const projectGroups = new Map<string | null, Map<string, { code: string; nameAr: string; type: string; debit: number; credit: number }>>();

	for (const line of lines) {
		const pId = line.projectId;
		if (!projectGroups.has(pId)) projectGroups.set(pId, new Map());
		const accountMap = projectGroups.get(pId)!;
		const key = line.account.code;
		if (!accountMap.has(key)) {
			accountMap.set(key, { code: line.account.code, nameAr: line.account.nameAr, type: line.account.type, debit: 0, credit: 0 });
		}
		const acc = accountMap.get(key)!;
		acc.debit += Number(line.debit);
		acc.credit += Number(line.credit);
	}

	// Build result
	let grandRevenue = 0;
	let grandExpenses = 0;

	const result: CostCenterProject[] = [];

	for (const [pId, accountMap] of projectGroups) {
		let totalRevenue = 0;
		let totalExpenses = 0;
		const accounts: CostCenterProject["accounts"] = [];

		for (const [, acc] of accountMap) {
			const amount = acc.type === "REVENUE" ? acc.credit - acc.debit : acc.debit - acc.credit;
			if (acc.type === "REVENUE") totalRevenue += amount;
			else if (acc.type === "EXPENSE") totalExpenses += amount;
			accounts.push({ code: acc.code, nameAr: acc.nameAr, type: acc.type, amount });
		}

		accounts.sort((a, b) => a.code.localeCompare(b.code));

		const netProfit = totalRevenue - totalExpenses;
		result.push({
			projectId: pId,
			projectName: pId ? (projectMap.get(pId) ?? "غير معروف") : "عام / غير مخصص",
			accounts,
			totalRevenue,
			totalExpenses,
			netProfit,
			profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
		});

		grandRevenue += totalRevenue;
		grandExpenses += totalExpenses;
	}

	result.sort((a, b) => b.netProfit - a.netProfit);

	return {
		projects: result,
		totals: { totalRevenue: grandRevenue, totalExpenses: grandExpenses, netProfit: grandRevenue - grandExpenses },
	};
}

// ========================================
// Accounting Dashboard (Feature 12)
// ========================================

export interface AccountingDashboardResult {
	totalAssets: number;
	totalLiabilities: number;
	netProfitThisMonth: number;
	totalRevenue: number;
	totalExpenses: number;
	accountsReceivable: number;
	accountsPayable: number;
	draftEntriesCount: number;
	isTrialBalanceBalanced: boolean;
	staleOpenPeriods: number;
}

export async function getAccountingDashboard(
	db: PrismaClient,
	organizationId: string,
): Promise<AccountingDashboardResult> {
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

	const [assetAgg, liabilityAgg, revenueAgg, expenseAgg, receivableAgg, payableAgg, draftCount, stalePeriodsCount, trialBalance] = await Promise.all([
		// Total Assets
		db.journalEntryLine.aggregate({
			where: {
				journalEntry: { organizationId, status: "POSTED" },
				account: { type: "ASSET", organizationId },
			},
			_sum: { debit: true, credit: true },
		}),
		// Total Liabilities
		db.journalEntryLine.aggregate({
			where: {
				journalEntry: { organizationId, status: "POSTED" },
				account: { type: "LIABILITY", organizationId },
			},
			_sum: { debit: true, credit: true },
		}),
		// Revenue this month
		db.journalEntryLine.aggregate({
			where: {
				journalEntry: { organizationId, status: "POSTED", date: { gte: monthStart, lte: monthEnd } },
				account: { type: "REVENUE", organizationId },
			},
			_sum: { debit: true, credit: true },
		}),
		// Expenses this month
		db.journalEntryLine.aggregate({
			where: {
				journalEntry: { organizationId, status: "POSTED", date: { gte: monthStart, lte: monthEnd } },
				account: { type: "EXPENSE", organizationId },
			},
			_sum: { debit: true, credit: true },
		}),
		// Accounts Receivable (1120)
		db.journalEntryLine.aggregate({
			where: {
				journalEntry: { organizationId, status: "POSTED" },
				account: { organizationId, code: "1120" },
			},
			_sum: { debit: true, credit: true },
		}),
		// Accounts Payable (2110 + 2120)
		db.journalEntryLine.aggregate({
			where: {
				journalEntry: { organizationId, status: "POSTED" },
				account: { organizationId, code: { in: ["2110", "2120"] } },
			},
			_sum: { debit: true, credit: true },
		}),
		// Draft entries count
		db.journalEntry.count({ where: { organizationId, status: "DRAFT" } }),
		// Stale open periods (endDate > 1 month ago, still open)
		db.accountingPeriod.count({
			where: { organizationId, isClosed: false, endDate: { lt: oneMonthAgo } },
		}),
		// Trial balance check
		getTrialBalance(db, organizationId, {}),
	]);

	const totalAssets = Number(assetAgg._sum.debit ?? 0) - Number(assetAgg._sum.credit ?? 0);
	const totalLiabilities = Number(liabilityAgg._sum.credit ?? 0) - Number(liabilityAgg._sum.debit ?? 0);
	const monthRevenue = Number(revenueAgg._sum.credit ?? 0) - Number(revenueAgg._sum.debit ?? 0);
	const monthExpenses = Number(expenseAgg._sum.debit ?? 0) - Number(expenseAgg._sum.credit ?? 0);
	const accountsReceivable = Number(receivableAgg._sum.debit ?? 0) - Number(receivableAgg._sum.credit ?? 0);
	const accountsPayable = Number(payableAgg._sum.credit ?? 0) - Number(payableAgg._sum.debit ?? 0);

	return {
		totalAssets,
		totalLiabilities,
		netProfitThisMonth: monthRevenue - monthExpenses,
		totalRevenue: monthRevenue,
		totalExpenses: monthExpenses,
		accountsReceivable,
		accountsPayable,
		draftEntriesCount: draftCount,
		isTrialBalanceBalanced: trialBalance.isBalanced,
		staleOpenPeriods: stalePeriodsCount,
	};
}

// ========================================
// Recurring Journal Entries (Feature 8)
// ========================================

export async function listRecurringTemplates(
	db: PrismaClient,
	organizationId: string,
) {
	const templates = await db.recurringJournalTemplate.findMany({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
	});
	return templates.map((t) => ({
		...t,
		totalAmount: Number(t.totalAmount),
	}));
}

export async function createRecurringTemplate(
	db: PrismaClient,
	organizationId: string,
	data: {
		description: string;
		lines: Array<{ accountId: string; debit: number; credit: number; description?: string; projectId?: string }>;
		frequency: string;
		dayOfMonth: number;
		startDate: Date;
		endDate?: Date;
		createdById: string;
	},
) {
	// Validate balance
	const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
	const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
	if (Math.abs(totalDebit - totalCredit) > 0.01) {
		throw new Error("بنود القالب غير متوازنة");
	}

	// Calculate next due date
	const nextDueDate = computeNextDueDate(data.startDate, data.frequency, data.dayOfMonth);

	return db.recurringJournalTemplate.create({
		data: {
			organizationId,
			description: data.description,
			lines: data.lines as any,
			totalAmount: totalDebit,
			frequency: data.frequency,
			dayOfMonth: data.dayOfMonth,
			startDate: data.startDate,
			endDate: data.endDate,
			nextDueDate,
			createdById: data.createdById,
		},
	});
}

export async function updateRecurringTemplate(
	db: PrismaClient,
	templateId: string,
	data: { description?: string; isActive?: boolean; endDate?: Date | null },
) {
	return db.recurringJournalTemplate.update({
		where: { id: templateId },
		data,
	});
}

export async function deleteRecurringTemplate(db: PrismaClient, templateId: string) {
	await db.recurringJournalTemplate.delete({ where: { id: templateId } });
}

export async function generateDueRecurringEntries(
	db: PrismaClient,
	organizationId: string,
	userId: string,
): Promise<{ generated: number }> {
	const today = new Date();
	today.setHours(23, 59, 59);

	const dueTemplates = await db.recurringJournalTemplate.findMany({
		where: {
			organizationId,
			isActive: true,
			nextDueDate: { lte: today },
			OR: [
				{ endDate: null },
				{ endDate: { gte: today } },
			],
		},
	});

	let generated = 0;

	for (const template of dueTemplates) {
		const lines = template.lines as Array<{ accountId: string; debit: number; credit: number; description?: string; projectId?: string }>;

		try {
			const result = await createJournalEntry(db, {
				organizationId,
				date: template.nextDueDate ?? today,
				description: template.description,
				referenceType: "ADJUSTMENT",
				isAutoGenerated: false, // DRAFT — needs manual posting
				lines: lines.map((l) => ({
					accountId: l.accountId,
					debit: new Prisma.Decimal(l.debit),
					credit: new Prisma.Decimal(l.credit),
					description: l.description,
					projectId: l.projectId ?? null,
				})),
				createdById: userId,
			});

			if (!result) continue; // Period closed — skip this template

			// Update template
			const nextDue = computeNextDueDate(
				template.nextDueDate ?? today,
				template.frequency,
				template.dayOfMonth,
			);

			await db.recurringJournalTemplate.update({
				where: { id: template.id },
				data: {
					lastGeneratedDate: template.nextDueDate ?? today,
					nextDueDate: nextDue,
				},
			});

			generated++;
		} catch (e) {
			// Skip templates that fail (e.g., period closed for manual entries)
			console.warn(`[Recurring] Skipped template ${template.id}: ${(e as Error).message}`);
		}
	}

	return { generated };
}

// ========================================
// Bank Reconciliation (Feature 7)
// ========================================

export async function getBankJournalLines(
	db: PrismaClient,
	organizationId: string,
	chartAccountId: string,
	dateFrom?: Date,
	dateTo?: Date,
) {
	const dateFilter: Record<string, Date> = {};
	if (dateFrom) dateFilter.gte = dateFrom;
	if (dateTo) dateFilter.lte = dateTo;

	const lines = await db.journalEntryLine.findMany({
		where: {
			accountId: chartAccountId,
			journalEntry: {
				organizationId,
				status: "POSTED",
				...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
			},
		},
		include: {
			journalEntry: {
				select: { id: true, entryNo: true, date: true, description: true, referenceType: true, referenceNo: true },
			},
		},
		orderBy: { journalEntry: { date: "asc" } },
	});

	return lines.map((l) => ({
		id: l.id,
		date: l.journalEntry.date,
		entryNo: l.journalEntry.entryNo,
		entryId: l.journalEntry.id,
		description: l.journalEntry.description,
		referenceType: l.journalEntry.referenceType,
		referenceNo: l.journalEntry.referenceNo,
		debit: Number(l.debit),
		credit: Number(l.credit),
		net: Number(l.debit) - Number(l.credit),
	}));
}

export async function createBankReconciliation(
	db: PrismaClient,
	organizationId: string,
	data: {
		bankAccountId: string;
		reconciliationDate: Date;
		statementBalance: number;
		bookBalance: number;
		matchedLineIds: string[];
		notes?: string;
		createdById: string;
	},
) {
	const difference = data.statementBalance - data.bookBalance;

	return db.bankReconciliation.create({
		data: {
			organizationId,
			bankAccountId: data.bankAccountId,
			reconciliationDate: data.reconciliationDate,
			statementBalance: data.statementBalance,
			bookBalance: data.bookBalance,
			difference,
			status: Math.abs(difference) < 0.01 ? "COMPLETED" : "DRAFT",
			notes: data.notes,
			createdById: data.createdById,
			completedAt: Math.abs(difference) < 0.01 ? new Date() : null,
			completedById: Math.abs(difference) < 0.01 ? data.createdById : null,
			items: {
				create: data.matchedLineIds.map((lineId) => ({
					journalEntryLineId: lineId,
					isMatched: true,
				})),
			},
		},
		include: { items: true },
	});
}

export async function listBankReconciliations(
	db: PrismaClient,
	organizationId: string,
	bankAccountId: string,
) {
	return db.bankReconciliation.findMany({
		where: { organizationId, bankAccountId },
		orderBy: { reconciliationDate: "desc" },
		take: 20,
	});
}

function computeNextDueDate(fromDate: Date, frequency: string, dayOfMonth: number): Date {
	const d = new Date(fromDate);
	switch (frequency) {
		case "MONTHLY":
			d.setMonth(d.getMonth() + 1);
			break;
		case "QUARTERLY":
			d.setMonth(d.getMonth() + 3);
			break;
		case "ANNUAL":
			d.setFullYear(d.getFullYear() + 1);
			break;
		default:
			d.setMonth(d.getMonth() + 1);
	}
	// Clamp day
	const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
	d.setDate(Math.min(dayOfMonth, maxDay));
	return d;
}

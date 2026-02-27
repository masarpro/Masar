import { db } from "../client";
import { Prisma } from "../generated/client";
import type {
	QuotationStatus,
	FinanceInvoiceStatus,
	InvoiceType,
	OpenDocumentType,
	FinanceTemplateType,
	ClientType,
} from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE CALCULATION HELPERS — حسابات الفاتورة (Decimal-safe)
// ═══════════════════════════════════════════════════════════════════════════

const D = (v: number | string | Prisma.Decimal) => new Prisma.Decimal(v);
const ZERO = D(0);
const HUNDRED = D(100);
const ROUND_HALF_UP = Prisma.Decimal.ROUND_HALF_UP;

/**
 * Single source of truth for invoice total calculations using Prisma.Decimal.
 * All amounts are rounded to 2 decimal places using ROUND_HALF_UP.
 */
export function calculateInvoiceTotals(
	items: Array<{ quantity: number | Prisma.Decimal; unitPrice: number | Prisma.Decimal }>,
	discountPercent: number | Prisma.Decimal = 0,
	vatPercent: number | Prisma.Decimal = 15,
) {
	const dp = D(discountPercent);
	const vp = D(vatPercent);

	let subtotal = ZERO;
	const itemTotals: Prisma.Decimal[] = [];

	for (const item of items) {
		const qty = D(item.quantity);
		const price = D(item.unitPrice);
		const total = qty.mul(price).toDecimalPlaces(2, ROUND_HALF_UP);
		itemTotals.push(total);
		subtotal = subtotal.add(total);
	}

	const discountAmount = subtotal.mul(dp).div(HUNDRED).toDecimalPlaces(2, ROUND_HALF_UP);
	const afterDiscount = subtotal.sub(discountAmount);
	const vatAmount = afterDiscount.mul(vp).div(HUNDRED).toDecimalPlaces(2, ROUND_HALF_UP);
	const totalAmount = afterDiscount.add(vatAmount);

	return {
		subtotal,
		discountAmount,
		afterDiscount,
		vatAmount,
		totalAmount,
		itemTotals,
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT QUERIES - استعلامات العملاء
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all clients for an organization with pagination and filters
 */
export async function getOrganizationClients(
	organizationId: string,
	options?: {
		query?: string;
		isActive?: boolean;
		clientType?: ClientType;
		classification?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		isActive?: boolean;
		clientType?: ClientType;
		classification?: { has: string };
		OR?: Array<{
			name?: { contains: string; mode: "insensitive" };
			company?: { contains: string; mode: "insensitive" };
			businessName?: { contains: string; mode: "insensitive" };
			firstName?: { contains: string; mode: "insensitive" };
			lastName?: { contains: string; mode: "insensitive" };
			email?: { contains: string; mode: "insensitive" };
			phone?: { contains: string };
			mobile?: { contains: string };
			code?: { contains: string; mode: "insensitive" };
		}>;
	} = { organizationId };

	if (options?.isActive !== undefined) {
		where.isActive = options.isActive;
	}

	if (options?.clientType) {
		where.clientType = options.clientType;
	}

	if (options?.classification) {
		where.classification = { has: options.classification };
	}

	if (options?.query) {
		where.OR = [
			{ name: { contains: options.query, mode: "insensitive" } },
			{ company: { contains: options.query, mode: "insensitive" } },
			{ businessName: { contains: options.query, mode: "insensitive" } },
			{ firstName: { contains: options.query, mode: "insensitive" } },
			{ lastName: { contains: options.query, mode: "insensitive" } },
			{ email: { contains: options.query, mode: "insensitive" } },
			{ phone: { contains: options.query } },
			{ mobile: { contains: options.query } },
			{ code: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [clients, total] = await Promise.all([
		db.client.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
				contacts: {
					where: { isPrimary: true },
					take: 1,
				},
				_count: {
					select: {
						quotations: true,
						invoices: true,
						contacts: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.client.count({ where }),
	]);

	return { clients, total };
}

/**
 * Get a single client by ID with full details
 */
export async function getClientById(id: string, organizationId: string) {
	return db.client.findFirst({
		where: { id, organizationId },
		include: {
			createdBy: { select: { id: true, name: true, email: true } },
			contacts: {
				orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
			},
			_count: {
				select: {
					quotations: true,
					invoices: true,
					contacts: true,
				},
			},
		},
	});
}

/**
 * Generate next client code for organization
 */
export async function generateClientCode(
	organizationId: string,
): Promise<string> {
	const prefix = "C-";

	const lastClient = await db.client.findFirst({
		where: {
			organizationId,
			code: { startsWith: prefix },
		},
		orderBy: { code: "desc" },
		select: { code: true },
	});

	let nextNumber = 1;
	if (lastClient?.code) {
		const lastNumber = parseInt(lastClient.code.replace(prefix, ""), 10);
		if (!isNaN(lastNumber)) {
			nextNumber = lastNumber + 1;
		}
	}

	return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
}

/**
 * Create a new client with full details
 */
export async function createClient(data: {
	organizationId: string;
	createdById: string;
	// نوع العميل
	clientType?: ClientType;
	// الأسماء
	firstName?: string;
	lastName?: string;
	businessName?: string;
	name: string;
	company?: string;
	// الاتصال
	phone?: string;
	mobile?: string;
	email?: string;
	// العنوان
	address?: string;
	streetAddress1?: string;
	streetAddress2?: string;
	city?: string;
	region?: string;
	postalCode?: string;
	country?: string;
	secondaryAddress?: object;
	// الحساب
	code?: string;
	currency?: string;
	displayLanguage?: string;
	classification?: string[];
	// الضريبة
	taxNumber?: string;
	crNumber?: string;
	// أخرى
	notes?: string;
}) {
	// إنشاء الكود تلقائياً إذا لم يُقدم
	const code = data.code || (await generateClientCode(data.organizationId));

	return db.client.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			clientType: data.clientType ?? "INDIVIDUAL",
			firstName: data.firstName,
			lastName: data.lastName,
			businessName: data.businessName,
			name: data.name,
			company: data.company,
			phone: data.phone,
			mobile: data.mobile,
			email: data.email,
			address: data.address,
			streetAddress1: data.streetAddress1,
			streetAddress2: data.streetAddress2,
			city: data.city,
			region: data.region,
			postalCode: data.postalCode,
			country: data.country ?? "SA",
			secondaryAddress: data.secondaryAddress,
			code,
			currency: data.currency ?? "SAR",
			displayLanguage: data.displayLanguage ?? "ar",
			classification: data.classification ?? [],
			taxNumber: data.taxNumber,
			crNumber: data.crNumber,
			notes: data.notes,
			isActive: true,
		},
		include: {
			contacts: true,
		},
	});
}

/**
 * Update a client with full details
 */
export async function updateClient(
	id: string,
	organizationId: string,
	data: Partial<{
		clientType: ClientType;
		firstName: string;
		lastName: string;
		businessName: string;
		name: string;
		company: string;
		phone: string;
		mobile: string;
		email: string;
		address: string;
		streetAddress1: string;
		streetAddress2: string;
		city: string;
		region: string;
		postalCode: string;
		country: string;
		secondaryAddress: object | null;
		code: string;
		currency: string;
		displayLanguage: string;
		classification: string[];
		taxNumber: string;
		crNumber: string;
		notes: string;
		isActive: boolean;
	}>,
) {
	const existing = await db.client.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Client not found");
	}

	return db.client.update({
		where: { id },
		data,
		include: {
			contacts: true,
		},
	});
}

/**
 * Delete a client (soft delete by setting isActive to false)
 */
export async function deleteClient(id: string, organizationId: string) {
	const existing = await db.client.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Client not found");
	}

	return db.client.update({
		where: { id },
		data: { isActive: false },
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT CONTACT QUERIES - استعلامات جهات الاتصال
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all contacts for a client
 */
export async function getClientContacts(clientId: string) {
	return db.clientContact.findMany({
		where: { clientId },
		orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
	});
}

/**
 * Get a single contact by ID
 */
export async function getClientContactById(id: string, clientId: string) {
	return db.clientContact.findFirst({
		where: { id, clientId },
	});
}

/**
 * Create a new client contact
 */
export async function createClientContact(data: {
	clientId: string;
	name: string;
	position?: string;
	phone?: string;
	mobile?: string;
	email?: string;
	isPrimary?: boolean;
	notes?: string;
}) {
	// إذا كانت جهة الاتصال رئيسية، قم بإلغاء الرئيسية من الجهات الأخرى
	if (data.isPrimary) {
		await db.clientContact.updateMany({
			where: { clientId: data.clientId, isPrimary: true },
			data: { isPrimary: false },
		});
	}

	return db.clientContact.create({
		data: {
			clientId: data.clientId,
			name: data.name,
			position: data.position,
			phone: data.phone,
			mobile: data.mobile,
			email: data.email,
			isPrimary: data.isPrimary ?? false,
			notes: data.notes,
		},
	});
}

/**
 * Update a client contact
 */
export async function updateClientContact(
	id: string,
	clientId: string,
	data: Partial<{
		name: string;
		position: string;
		phone: string;
		mobile: string;
		email: string;
		isPrimary: boolean;
		notes: string;
	}>,
) {
	const existing = await db.clientContact.findFirst({
		where: { id, clientId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Contact not found");
	}

	// إذا تم تعيين هذه الجهة كرئيسية، قم بإلغاء الرئيسية من الجهات الأخرى
	if (data.isPrimary) {
		await db.clientContact.updateMany({
			where: { clientId, isPrimary: true, NOT: { id } },
			data: { isPrimary: false },
		});
	}

	return db.clientContact.update({
		where: { id },
		data,
	});
}

/**
 * Delete a client contact
 */
export async function deleteClientContact(id: string, clientId: string) {
	const existing = await db.clientContact.findFirst({
		where: { id, clientId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Contact not found");
	}

	return db.clientContact.delete({ where: { id } });
}

/**
 * Set a contact as primary
 */
export async function setClientContactAsPrimary(id: string, clientId: string) {
	const existing = await db.clientContact.findFirst({
		where: { id, clientId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Contact not found");
	}

	// إلغاء الرئيسية من جميع الجهات
	await db.clientContact.updateMany({
		where: { clientId, isPrimary: true },
		data: { isPrimary: false },
	});

	// تعيين هذه الجهة كرئيسية
	return db.clientContact.update({
		where: { id },
		data: { isPrimary: true },
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTATION QUERIES - استعلامات عروض الأسعار
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate next quotation number for organization
 */
export async function generateQuotationNumber(
	organizationId: string,
): Promise<string> {
	const { generateAtomicNo } = await import("./sequences");
	return generateAtomicNo(organizationId, "QT");
}

/**
 * Get all quotations for an organization with pagination and filters
 */
export async function getOrganizationQuotations(
	organizationId: string,
	options?: {
		status?: QuotationStatus;
		clientId?: string;
		projectId?: string;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		status?: QuotationStatus;
		clientId?: string;
		projectId?: string;
		OR?: Array<{
			quotationNo?: { contains: string; mode: "insensitive" };
			clientName?: { contains: string; mode: "insensitive" };
			clientCompany?: { contains: string; mode: "insensitive" };
		}>;
	} = { organizationId };

	if (options?.status) {
		where.status = options.status;
	}

	if (options?.clientId) {
		where.clientId = options.clientId;
	}

	if (options?.projectId) {
		where.projectId = options.projectId;
	}

	if (options?.query) {
		where.OR = [
			{ quotationNo: { contains: options.query, mode: "insensitive" } },
			{ clientName: { contains: options.query, mode: "insensitive" } },
			{ clientCompany: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [quotations, total] = await Promise.all([
		db.quotation.findMany({
			where,
			include: {
				client: { select: { id: true, name: true, company: true } },
				project: { select: { id: true, name: true, slug: true } },
				createdBy: { select: { id: true, name: true } },
				_count: { select: { items: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.quotation.count({ where }),
	]);

	return { quotations, total };
}

/**
 * Get a single quotation by ID with all items
 */
export async function getQuotationById(id: string, organizationId: string) {
	return db.quotation.findFirst({
		where: { id, organizationId },
		include: {
			client: true,
			project: { select: { id: true, name: true, slug: true } },
			template: { select: { id: true, name: true, content: true, settings: true } },
			createdBy: { select: { id: true, name: true, email: true } },
			items: { orderBy: { sortOrder: "asc" } },
		},
	});
}

/**
 * Create a new quotation
 */
export async function createQuotation(data: {
	organizationId: string;
	createdById: string;
	clientId?: string;
	clientName: string;
	clientCompany?: string;
	clientPhone?: string;
	clientEmail?: string;
	clientAddress?: string;
	clientTaxNumber?: string;
	projectId?: string;
	validUntil: Date;
	paymentTerms?: string;
	deliveryTerms?: string;
	warrantyTerms?: string;
	notes?: string;
	templateId?: string;
	vatPercent?: number;
	discountPercent?: number;
	items: Array<{
		description: string;
		quantity: number;
		unit?: string;
		unitPrice: number;
	}>;
}) {
	const quotationNo = await generateQuotationNumber(data.organizationId);

	// Calculate totals
	let subtotal = 0;
	const itemsData = data.items.map((item, index) => {
		const totalPrice = item.quantity * item.unitPrice;
		subtotal += totalPrice;
		return {
			description: item.description,
			quantity: item.quantity,
			unit: item.unit,
			unitPrice: item.unitPrice,
			totalPrice,
			sortOrder: index,
		};
	});

	const discountPercent = data.discountPercent ?? 0;
	const discountAmount = (subtotal * discountPercent) / 100;
	const afterDiscount = subtotal - discountAmount;
	const vatPercent = data.vatPercent ?? 15;
	const vatAmount = (afterDiscount * vatPercent) / 100;
	const totalAmount = afterDiscount + vatAmount;

	return db.quotation.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			quotationNo,
			clientId: data.clientId,
			clientName: data.clientName,
			clientCompany: data.clientCompany,
			clientPhone: data.clientPhone,
			clientEmail: data.clientEmail,
			clientAddress: data.clientAddress,
			clientTaxNumber: data.clientTaxNumber,
			projectId: data.projectId,
			status: "DRAFT",
			validUntil: data.validUntil,
			paymentTerms: data.paymentTerms,
			deliveryTerms: data.deliveryTerms,
			warrantyTerms: data.warrantyTerms,
			notes: data.notes,
			templateId: data.templateId,
			subtotal,
			discountPercent,
			discountAmount,
			vatPercent,
			vatAmount,
			totalAmount,
			items: {
				create: itemsData,
			},
		},
		include: {
			items: true,
		},
	});
}

/**
 * Update a quotation
 */
export async function updateQuotation(
	id: string,
	organizationId: string,
	data: Partial<{
		clientId: string | null;
		clientName: string;
		clientCompany: string;
		clientPhone: string;
		clientEmail: string;
		clientAddress: string;
		clientTaxNumber: string;
		projectId: string | null;
		status: QuotationStatus;
		validUntil: Date;
		paymentTerms: string;
		deliveryTerms: string;
		warrantyTerms: string;
		notes: string;
		templateId: string | null;
		vatPercent: number;
		discountPercent: number;
	}>,
) {
	const existing = await db.quotation.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Quotation not found");
	}

	return db.quotation.update({
		where: { id },
		data,
	});
}

/**
 * Update quotation items and recalculate totals
 */
export async function updateQuotationItems(
	id: string,
	organizationId: string,
	items: Array<{
		id?: string;
		description: string;
		quantity: number;
		unit?: string;
		unitPrice: number;
	}>,
) {
	const existing = await db.quotation.findFirst({
		where: { id, organizationId },
		select: { id: true, discountPercent: true, vatPercent: true },
	});

	if (!existing) {
		throw new Error("Quotation not found");
	}

	// Delete existing items and create new ones
	await db.quotationItem.deleteMany({ where: { quotationId: id } });

	let subtotal = 0;
	const itemsData = items.map((item, index) => {
		const totalPrice = item.quantity * item.unitPrice;
		subtotal += totalPrice;
		return {
			quotationId: id,
			description: item.description,
			quantity: item.quantity,
			unit: item.unit,
			unitPrice: item.unitPrice,
			totalPrice,
			sortOrder: index,
		};
	});

	await db.quotationItem.createMany({ data: itemsData });

	// Recalculate totals
	const discountPercent = Number(existing.discountPercent);
	const discountAmount = (subtotal * discountPercent) / 100;
	const afterDiscount = subtotal - discountAmount;
	const vatPercent = Number(existing.vatPercent);
	const vatAmount = (afterDiscount * vatPercent) / 100;
	const totalAmount = afterDiscount + vatAmount;

	return db.quotation.update({
		where: { id },
		data: {
			subtotal,
			discountAmount,
			vatAmount,
			totalAmount,
		},
		include: { items: { orderBy: { sortOrder: "asc" } } },
	});
}

/**
 * Update quotation status
 */
export async function updateQuotationStatus(
	id: string,
	organizationId: string,
	status: QuotationStatus,
) {
	const existing = await db.quotation.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Quotation not found");
	}

	const updateData: {
		status: QuotationStatus;
		sentAt?: Date;
		viewedAt?: Date;
		acceptedAt?: Date;
		rejectedAt?: Date;
	} = { status };

	if (status === "SENT") {
		updateData.sentAt = new Date();
	} else if (status === "VIEWED") {
		updateData.viewedAt = new Date();
	} else if (status === "ACCEPTED") {
		updateData.acceptedAt = new Date();
	} else if (status === "REJECTED") {
		updateData.rejectedAt = new Date();
	}

	return db.quotation.update({
		where: { id },
		data: updateData,
	});
}

/**
 * Delete a quotation
 */
export async function deleteQuotation(id: string, organizationId: string) {
	const existing = await db.quotation.findFirst({
		where: { id, organizationId },
		select: { id: true, status: true },
	});

	if (!existing) {
		throw new Error("Quotation not found");
	}

	if (existing.status === "CONVERTED") {
		throw new Error("Cannot delete a converted quotation");
	}

	return db.quotation.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE QUERIES - استعلامات الفواتير
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate next invoice number for organization
 */
export async function generateInvoiceNumber(
	organizationId: string,
): Promise<string> {
	const { generateAtomicNo } = await import("./sequences");
	return generateAtomicNo(organizationId, "INV");
}

/**
 * Get all invoices for an organization with pagination and filters
 */
export async function getOrganizationInvoices(
	organizationId: string,
	options?: {
		status?: FinanceInvoiceStatus;
		invoiceType?: InvoiceType;
		clientId?: string;
		projectId?: string;
		query?: string;
		overdue?: boolean;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		status?: FinanceInvoiceStatus;
		invoiceType?: InvoiceType;
		clientId?: string;
		projectId?: string;
		dueDate?: { lt: Date };
		OR?: Array<{
			invoiceNo?: { contains: string; mode: "insensitive" };
			clientName?: { contains: string; mode: "insensitive" };
			clientCompany?: { contains: string; mode: "insensitive" };
		}>;
	} = { organizationId };

	if (options?.status) {
		where.status = options.status;
	}

	if (options?.invoiceType) {
		where.invoiceType = options.invoiceType;
	}

	if (options?.clientId) {
		where.clientId = options.clientId;
	}

	if (options?.projectId) {
		where.projectId = options.projectId;
	}

	if (options?.overdue) {
		where.dueDate = { lt: new Date() };
		where.status = "SENT";
	}

	if (options?.query) {
		where.OR = [
			{ invoiceNo: { contains: options.query, mode: "insensitive" } },
			{ clientName: { contains: options.query, mode: "insensitive" } },
			{ clientCompany: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [invoices, total] = await Promise.all([
		db.financeInvoice.findMany({
			where,
			include: {
				client: { select: { id: true, name: true, company: true } },
				project: { select: { id: true, name: true, slug: true } },
				createdBy: { select: { id: true, name: true } },
				_count: { select: { items: true, payments: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.financeInvoice.count({ where }),
	]);

	return { invoices, total };
}

/**
 * Get a single invoice by ID with all items and payments
 */
export async function getInvoiceById(id: string, organizationId: string) {
	return db.financeInvoice.findFirst({
		where: { id, organizationId },
		include: {
			client: true,
			project: { select: { id: true, name: true, slug: true } },
			quotation: { select: { id: true, quotationNo: true } },
			template: { select: { id: true, name: true, content: true, settings: true } },
			createdBy: { select: { id: true, name: true, email: true } },
			items: { orderBy: { sortOrder: "asc" } },
			payments: {
				orderBy: { paymentDate: "desc" },
				include: {
					createdBy: { select: { id: true, name: true } },
				},
			},
			relatedInvoice: {
				select: { id: true, invoiceNo: true, invoiceType: true, totalAmount: true, status: true },
			},
			creditNotes: {
				select: { id: true, invoiceNo: true, invoiceType: true, totalAmount: true, status: true, createdAt: true },
				orderBy: { createdAt: "desc" },
			},
		},
	});
}

/**
 * Create a new invoice
 */
export async function createInvoice(data: {
	organizationId: string;
	createdById: string;
	invoiceType?: InvoiceType;
	clientId?: string;
	clientName: string;
	clientCompany?: string;
	clientPhone?: string;
	clientEmail?: string;
	clientAddress?: string;
	clientTaxNumber?: string;
	projectId?: string;
	quotationId?: string;
	issueDate: Date;
	dueDate: Date;
	paymentTerms?: string;
	notes?: string;
	templateId?: string;
	vatPercent?: number;
	discountPercent?: number;
	sellerTaxNumber?: string;
	items: Array<{
		description: string;
		quantity: number;
		unit?: string;
		unitPrice: number;
	}>;
}) {
	const invoiceNo = await generateInvoiceNumber(data.organizationId);

	// Calculate totals using Decimal
	const discountPercent = data.discountPercent ?? 0;
	const vatPercent = data.vatPercent ?? 15;
	const totals = calculateInvoiceTotals(data.items, discountPercent, vatPercent);

	const itemsData = data.items.map((item, index) => ({
		description: item.description,
		quantity: item.quantity,
		unit: item.unit,
		unitPrice: item.unitPrice,
		totalPrice: totals.itemTotals[index],
		sortOrder: index,
	}));

	return db.financeInvoice.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			invoiceNo,
			invoiceType: data.invoiceType ?? "STANDARD",
			clientId: data.clientId,
			clientName: data.clientName,
			clientCompany: data.clientCompany,
			clientPhone: data.clientPhone,
			clientEmail: data.clientEmail,
			clientAddress: data.clientAddress,
			clientTaxNumber: data.clientTaxNumber,
			projectId: data.projectId,
			quotationId: data.quotationId,
			status: "DRAFT",
			issueDate: data.issueDate,
			dueDate: data.dueDate,
			paymentTerms: data.paymentTerms,
			notes: data.notes,
			templateId: data.templateId,
			subtotal: totals.subtotal,
			discountPercent,
			discountAmount: totals.discountAmount,
			vatPercent,
			vatAmount: totals.vatAmount,
			totalAmount: totals.totalAmount,
			paidAmount: 0,
			sellerTaxNumber: data.sellerTaxNumber,
			items: {
				create: itemsData,
			},
		},
		include: {
			items: true,
		},
	});
}

/**
 * Update an invoice
 */
export async function updateInvoice(
	id: string,
	organizationId: string,
	data: Partial<{
		invoiceType: InvoiceType;
		clientId: string | null;
		clientName: string;
		clientCompany: string;
		clientPhone: string;
		clientEmail: string;
		clientAddress: string;
		clientTaxNumber: string;
		projectId: string | null;
		status: FinanceInvoiceStatus;
		issueDate: Date;
		dueDate: Date;
		paymentTerms: string;
		notes: string;
		templateId: string | null;
		vatPercent: number;
		discountPercent: number;
		sellerTaxNumber: string;
		qrCode: string;
		zatcaUuid: string;
		zatcaHash: string;
		zatcaSignature: string;
	}>,
) {
	const existing = await db.financeInvoice.findFirst({
		where: { id, organizationId },
		select: { id: true, status: true },
	});

	if (!existing) {
		throw new Error("Invoice not found");
	}

	// Edit lock: only DRAFT invoices can be edited
	if (existing.status !== "DRAFT") {
		throw new Error("لا يمكن تعديل فاتورة تم إصدارها. يمكنك فقط تعديل الفواتير في حالة مسودة.");
	}

	return db.financeInvoice.update({
		where: { id },
		data,
	});
}

/**
 * Update invoice items and recalculate totals
 */
export async function updateInvoiceItems(
	id: string,
	organizationId: string,
	items: Array<{
		id?: string;
		description: string;
		quantity: number;
		unit?: string;
		unitPrice: number;
	}>,
) {
	const existing = await db.financeInvoice.findFirst({
		where: { id, organizationId },
		select: { id: true, status: true, discountPercent: true, vatPercent: true },
	});

	if (!existing) {
		throw new Error("Invoice not found");
	}

	// Edit lock: only DRAFT invoices can be edited
	if (existing.status !== "DRAFT") {
		throw new Error("لا يمكن تعديل بنود فاتورة تم إصدارها. يمكنك فقط تعديل الفواتير في حالة مسودة.");
	}

	// Delete existing items and create new ones
	await db.financeInvoiceItem.deleteMany({ where: { invoiceId: id } });

	// Recalculate totals using Decimal
	const totals = calculateInvoiceTotals(items, existing.discountPercent, existing.vatPercent);

	const itemsData = items.map((item, index) => ({
		invoiceId: id,
		description: item.description,
		quantity: item.quantity,
		unit: item.unit,
		unitPrice: item.unitPrice,
		totalPrice: totals.itemTotals[index],
		sortOrder: index,
	}));

	await db.financeInvoiceItem.createMany({ data: itemsData });

	return db.financeInvoice.update({
		where: { id },
		data: {
			subtotal: totals.subtotal,
			discountAmount: totals.discountAmount,
			vatAmount: totals.vatAmount,
			totalAmount: totals.totalAmount,
		},
		include: { items: { orderBy: { sortOrder: "asc" } } },
	});
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
	id: string,
	organizationId: string,
	status: FinanceInvoiceStatus,
) {
	const existing = await db.financeInvoice.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Invoice not found");
	}

	const updateData: {
		status: FinanceInvoiceStatus;
		sentAt?: Date;
		viewedAt?: Date;
	} = { status };

	if (status === "SENT") {
		updateData.sentAt = new Date();
	} else if (status === "VIEWED") {
		updateData.viewedAt = new Date();
	}

	return db.financeInvoice.update({
		where: { id },
		data: updateData,
	});
}

/**
 * Add a payment to an invoice
 */
export async function addInvoicePayment(
	invoiceId: string,
	organizationId: string,
	data: {
		createdById: string;
		amount: number;
		paymentDate: Date;
		paymentMethod?: string;
		referenceNo?: string;
		notes?: string;
	},
) {
	const invoice = await db.financeInvoice.findFirst({
		where: { id: invoiceId, organizationId },
		select: { id: true, totalAmount: true, paidAmount: true },
	});

	if (!invoice) {
		throw new Error("Invoice not found");
	}

	const newPaidAmount = Number(invoice.paidAmount) + data.amount;
	const totalAmount = Number(invoice.totalAmount);

	// Determine new status
	let newStatus: FinanceInvoiceStatus;
	if (newPaidAmount >= totalAmount) {
		newStatus = "PAID";
	} else if (newPaidAmount > 0) {
		newStatus = "PARTIALLY_PAID";
	} else {
		newStatus = "ISSUED";
	}

	// Create payment and update invoice in transaction
	return db.$transaction(async (tx) => {
		const payment = await tx.financeInvoicePayment.create({
			data: {
				invoiceId,
				createdById: data.createdById,
				amount: data.amount,
				paymentDate: data.paymentDate,
				paymentMethod: data.paymentMethod,
				referenceNo: data.referenceNo,
				notes: data.notes,
			},
		});

		await tx.financeInvoice.update({
			where: { id: invoiceId },
			data: {
				paidAmount: newPaidAmount,
				status: newStatus,
			},
		});

		return payment;
	});
}

/**
 * Delete a payment from an invoice
 */
export async function deleteInvoicePayment(
	paymentId: string,
	invoiceId: string,
	organizationId: string,
) {
	const invoice = await db.financeInvoice.findFirst({
		where: { id: invoiceId, organizationId },
		select: { id: true, totalAmount: true, paidAmount: true },
	});

	if (!invoice) {
		throw new Error("Invoice not found");
	}

	const payment = await db.financeInvoicePayment.findFirst({
		where: { id: paymentId, invoiceId },
		select: { id: true, amount: true },
	});

	if (!payment) {
		throw new Error("Payment not found");
	}

	const newPaidAmount = Number(invoice.paidAmount) - Number(payment.amount);
	const totalAmount = Number(invoice.totalAmount);

	// Determine new status
	let newStatus: FinanceInvoiceStatus;
	if (newPaidAmount >= totalAmount) {
		newStatus = "PAID";
	} else if (newPaidAmount > 0) {
		newStatus = "PARTIALLY_PAID";
	} else {
		newStatus = "ISSUED";
	}

	return db.$transaction(async (tx) => {
		await tx.financeInvoicePayment.delete({ where: { id: paymentId } });

		await tx.financeInvoice.update({
			where: { id: invoiceId },
			data: {
				paidAmount: newPaidAmount,
				status: newStatus,
			},
		});
	});
}

/**
 * Convert a quotation to an invoice
 */
export async function convertQuotationToInvoice(
	quotationId: string,
	organizationId: string,
	createdById: string,
	data?: {
		issueDate?: Date;
		dueDate?: Date;
		invoiceType?: InvoiceType;
	},
) {
	const quotation = await db.quotation.findFirst({
		where: { id: quotationId, organizationId },
		include: { items: true },
	});

	if (!quotation) {
		throw new Error("Quotation not found");
	}

	if (quotation.status === "CONVERTED") {
		throw new Error("Quotation already converted");
	}

	// Only allow converting accepted quotations
	if (quotation.status !== "ACCEPTED") {
		throw new Error("Only accepted quotations can be converted to invoices");
	}

	const invoiceNo = await generateInvoiceNumber(organizationId);
	const today = new Date();
	const dueDate = data?.dueDate ?? new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

	return db.$transaction(async (tx) => {
		// Create invoice
		const invoice = await tx.financeInvoice.create({
			data: {
				organizationId,
				createdById,
				invoiceNo,
				invoiceType: data?.invoiceType ?? "STANDARD",
				clientId: quotation.clientId,
				clientName: quotation.clientName,
				clientCompany: quotation.clientCompany,
				clientPhone: quotation.clientPhone,
				clientEmail: quotation.clientEmail,
				clientAddress: quotation.clientAddress,
				clientTaxNumber: quotation.clientTaxNumber,
				projectId: quotation.projectId,
				quotationId: quotation.id,
				status: "DRAFT",
				issueDate: data?.issueDate ?? today,
				dueDate,
				paymentTerms: quotation.paymentTerms,
				notes: quotation.notes,
				templateId: quotation.templateId,
				subtotal: quotation.subtotal,
				discountPercent: quotation.discountPercent,
				discountAmount: quotation.discountAmount,
				vatPercent: quotation.vatPercent,
				vatAmount: quotation.vatAmount,
				totalAmount: quotation.totalAmount,
				paidAmount: 0,
				items: {
					create: quotation.items.map((item) => ({
						description: item.description,
						quantity: item.quantity,
						unit: item.unit,
						unitPrice: item.unitPrice,
						totalPrice: item.totalPrice,
						sortOrder: item.sortOrder,
					})),
				},
			},
			include: { items: true },
		});

		// Update quotation status
		await tx.quotation.update({
			where: { id: quotationId },
			data: { status: "CONVERTED" },
		});

		return invoice;
	});
}

/**
 * Issue an invoice — transitions from DRAFT to ISSUED
 * Recalculates totals, freezes seller snapshot, stores QR/UUID/issuedAt
 */
export async function issueInvoice(
	id: string,
	organizationId: string,
	data: {
		sellerName: string;
		sellerTaxNumber?: string;
		sellerAddress?: string;
		sellerPhone?: string;
		qrCode?: string;
		zatcaUuid?: string;
	},
) {
	return db.$transaction(async (tx) => {
		const invoice = await tx.financeInvoice.findFirst({
			where: { id, organizationId },
			include: { items: true },
		});

		if (!invoice) {
			throw new Error("الفاتورة غير موجودة");
		}

		if (invoice.status !== "DRAFT") {
			throw new Error("لا يمكن إصدار فاتورة ليست في حالة مسودة");
		}

		// Recalculate totals
		const totals = calculateInvoiceTotals(
			invoice.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
			invoice.discountPercent,
			invoice.vatPercent,
		);

		// Update item totals
		for (let idx = 0; idx < invoice.items.length; idx++) {
			await tx.financeInvoiceItem.update({
				where: { id: invoice.items[idx].id },
				data: { totalPrice: totals.itemTotals[idx] },
			});
		}

		// Update invoice with frozen totals, seller snapshot, and ZATCA data
		return tx.financeInvoice.update({
			where: { id },
			data: {
				status: "ISSUED",
				issuedAt: new Date(),
				subtotal: totals.subtotal,
				discountAmount: totals.discountAmount,
				vatAmount: totals.vatAmount,
				totalAmount: totals.totalAmount,
				sellerName: data.sellerName,
				sellerTaxNumber: data.sellerTaxNumber,
				sellerAddress: data.sellerAddress,
				sellerPhone: data.sellerPhone,
				qrCode: data.qrCode,
				zatcaUuid: data.zatcaUuid,
			},
			include: { items: { orderBy: { sortOrder: "asc" } } },
		});
	});
}

/**
 * Duplicate an invoice — creates a new DRAFT copy with fresh number
 */
export async function duplicateInvoice(
	id: string,
	organizationId: string,
	createdById: string,
) {
	const original = await db.financeInvoice.findFirst({
		where: { id, organizationId },
		include: { items: { orderBy: { sortOrder: "asc" } } },
	});

	if (!original) {
		throw new Error("الفاتورة غير موجودة");
	}

	const invoiceNo = await generateInvoiceNumber(organizationId);
	const today = new Date();
	const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

	return db.financeInvoice.create({
		data: {
			organizationId,
			createdById,
			invoiceNo,
			invoiceType: original.invoiceType === "CREDIT_NOTE" || original.invoiceType === "DEBIT_NOTE"
				? "STANDARD"
				: original.invoiceType,
			clientId: original.clientId,
			clientName: original.clientName,
			clientCompany: original.clientCompany,
			clientPhone: original.clientPhone,
			clientEmail: original.clientEmail,
			clientAddress: original.clientAddress,
			clientTaxNumber: original.clientTaxNumber,
			projectId: original.projectId,
			status: "DRAFT",
			issueDate: today,
			dueDate,
			paymentTerms: original.paymentTerms,
			notes: original.notes,
			templateId: original.templateId,
			subtotal: original.subtotal,
			discountPercent: original.discountPercent,
			discountAmount: original.discountAmount,
			vatPercent: original.vatPercent,
			vatAmount: original.vatAmount,
			totalAmount: original.totalAmount,
			paidAmount: 0,
			items: {
				create: original.items.map((item) => ({
					description: item.description,
					quantity: item.quantity,
					unit: item.unit,
					unitPrice: item.unitPrice,
					totalPrice: item.totalPrice,
					sortOrder: item.sortOrder,
				})),
			},
		},
		include: { items: true },
	});
}

/**
 * Create a credit note linked to an original invoice
 */
export async function createCreditNote(data: {
	organizationId: string;
	createdById: string;
	originalInvoiceId: string;
	reason: string;
	items: Array<{
		description: string;
		quantity: number;
		unit?: string;
		unitPrice: number;
	}>;
	qrCode?: string;
	zatcaUuid?: string;
	sellerName?: string;
	sellerTaxNumber?: string;
	sellerAddress?: string;
	sellerPhone?: string;
}) {
	const original = await db.financeInvoice.findFirst({
		where: { id: data.originalInvoiceId, organizationId: data.organizationId },
		select: {
			id: true, status: true, clientId: true, clientName: true,
			clientCompany: true, clientPhone: true, clientEmail: true,
			clientAddress: true, clientTaxNumber: true, projectId: true,
			vatPercent: true, discountPercent: true,
		},
	});

	if (!original) {
		throw new Error("الفاتورة الأصلية غير موجودة");
	}

	if (original.status === "DRAFT" || original.status === "CANCELLED") {
		throw new Error("لا يمكن إنشاء إشعار دائن لفاتورة مسودة أو ملغية");
	}

	const invoiceNo = await generateInvoiceNumber(data.organizationId);
	const totals = calculateInvoiceTotals(data.items, original.discountPercent, original.vatPercent);

	// Negate amounts for credit note (ZATCA: credit notes are reversals)
	const negSubtotal = totals.subtotal.neg();
	const negDiscountAmount = totals.discountAmount.neg();
	const negVatAmount = totals.vatAmount.neg();
	const negTotalAmount = totals.totalAmount.neg();

	const itemsData = data.items.map((item, index) => ({
		description: item.description,
		quantity: item.quantity,
		unit: item.unit,
		unitPrice: item.unitPrice,
		totalPrice: totals.itemTotals[index].neg(),
		sortOrder: index,
	}));

	return db.financeInvoice.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			invoiceNo,
			invoiceType: "CREDIT_NOTE",
			relatedInvoiceId: data.originalInvoiceId,
			clientId: original.clientId,
			clientName: original.clientName,
			clientCompany: original.clientCompany,
			clientPhone: original.clientPhone,
			clientEmail: original.clientEmail,
			clientAddress: original.clientAddress,
			clientTaxNumber: original.clientTaxNumber,
			projectId: original.projectId,
			status: "ISSUED",
			issuedAt: new Date(),
			issueDate: new Date(),
			dueDate: new Date(),
			paymentTerms: null,
			notes: data.reason,
			subtotal: negSubtotal,
			discountPercent: original.discountPercent,
			discountAmount: negDiscountAmount,
			vatPercent: original.vatPercent,
			vatAmount: negVatAmount,
			totalAmount: negTotalAmount,
			paidAmount: 0,
			sellerName: data.sellerName,
			sellerTaxNumber: data.sellerTaxNumber,
			sellerAddress: data.sellerAddress,
			sellerPhone: data.sellerPhone,
			qrCode: data.qrCode,
			zatcaUuid: data.zatcaUuid,
			items: {
				create: itemsData,
			},
		},
		include: { items: true },
	});
}

/**
 * Update only the notes field of an invoice (no status restriction)
 */
export async function updateInvoiceNotes(
	id: string,
	organizationId: string,
	notes: string,
) {
	const existing = await db.financeInvoice.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Invoice not found");
	}

	return db.financeInvoice.update({
		where: { id },
		data: { notes },
	});
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(id: string, organizationId: string) {
	const existing = await db.financeInvoice.findFirst({
		where: { id, organizationId },
		select: { id: true, status: true },
	});

	if (!existing) {
		throw new Error("Invoice not found");
	}

	if (existing.status !== "DRAFT") {
		throw new Error("لا يمكن حذف فاتورة تم إصدارها. يمكنك فقط حذف الفواتير في حالة مسودة.");
	}

	return db.financeInvoice.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════════════════════
// OPEN DOCUMENT QUERIES - استعلامات المستندات المفتوحة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate next document number for organization
 */
export async function generateDocumentNumber(
	organizationId: string,
	type: OpenDocumentType,
): Promise<string> {
	const { generateAtomicNo } = await import("./sequences");
	const prefix = `DOC-${type.substring(0, 3).toUpperCase()}`;
	return generateAtomicNo(organizationId, prefix);
}

/**
 * Get all open documents for an organization
 */
export async function getOrganizationOpenDocuments(
	organizationId: string,
	options?: {
		documentType?: OpenDocumentType;
		projectId?: string;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		documentType?: OpenDocumentType;
		projectId?: string;
		OR?: Array<{
			documentNo?: { contains: string; mode: "insensitive" };
			title?: { contains: string; mode: "insensitive" };
			recipientName?: { contains: string; mode: "insensitive" };
		}>;
	} = { organizationId };

	if (options?.documentType) {
		where.documentType = options.documentType;
	}

	if (options?.projectId) {
		where.projectId = options.projectId;
	}

	if (options?.query) {
		where.OR = [
			{ documentNo: { contains: options.query, mode: "insensitive" } },
			{ title: { contains: options.query, mode: "insensitive" } },
			{ recipientName: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [documents, total] = await Promise.all([
		db.openDocument.findMany({
			where,
			include: {
				project: { select: { id: true, name: true, slug: true } },
				template: { select: { id: true, name: true } },
				createdBy: { select: { id: true, name: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.openDocument.count({ where }),
	]);

	return { documents, total };
}

/**
 * Get a single open document by ID
 */
export async function getOpenDocumentById(id: string, organizationId: string) {
	return db.openDocument.findFirst({
		where: { id, organizationId },
		include: {
			project: { select: { id: true, name: true, slug: true } },
			template: { select: { id: true, name: true, content: true, settings: true } },
			createdBy: { select: { id: true, name: true, email: true } },
		},
	});
}

/**
 * Create a new open document
 */
export async function createOpenDocument(data: {
	organizationId: string;
	createdById: string;
	documentType: OpenDocumentType;
	title: string;
	content: string;
	clientId?: string;
	projectId?: string;
	recipientName?: string;
	recipientCompany?: string;
	recipientAddress?: string;
	templateId?: string;
}) {
	const documentNo = await generateDocumentNumber(
		data.organizationId,
		data.documentType,
	);

	return db.openDocument.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			documentNo,
			documentType: data.documentType,
			title: data.title,
			content: data.content,
			clientId: data.clientId,
			projectId: data.projectId,
			recipientName: data.recipientName,
			recipientCompany: data.recipientCompany,
			recipientAddress: data.recipientAddress,
			templateId: data.templateId,
		},
	});
}

/**
 * Update an open document
 */
export async function updateOpenDocument(
	id: string,
	organizationId: string,
	data: Partial<{
		documentType: OpenDocumentType;
		title: string;
		content: string;
		clientId: string | null;
		projectId: string | null;
		recipientName: string;
		recipientCompany: string;
		recipientAddress: string;
		templateId: string | null;
	}>,
) {
	const existing = await db.openDocument.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Document not found");
	}

	return db.openDocument.update({
		where: { id },
		data,
	});
}

/**
 * Delete an open document
 */
export async function deleteOpenDocument(id: string, organizationId: string) {
	const existing = await db.openDocument.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Document not found");
	}

	return db.openDocument.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════════════════════
// FINANCE TEMPLATE QUERIES - استعلامات القوالب
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all templates for an organization
 */
export async function getOrganizationFinanceTemplates(
	organizationId: string,
	options?: {
		templateType?: FinanceTemplateType;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		templateType?: FinanceTemplateType;
	} = { organizationId };

	if (options?.templateType) {
		where.templateType = options.templateType;
	}

	const [templates, total] = await Promise.all([
		db.financeTemplate.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
				_count: {
					select: {
						quotations: true,
						invoices: true,
						openDocuments: true,
					},
				},
			},
			orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.financeTemplate.count({ where }),
	]);

	return { templates, total };
}

/**
 * Get a single template by ID
 */
export async function getFinanceTemplateById(
	id: string,
	organizationId: string,
) {
	return db.financeTemplate.findFirst({
		where: { id, organizationId },
		include: {
			createdBy: { select: { id: true, name: true, email: true } },
		},
	});
}

/**
 * Get default template for a type
 */
export async function getDefaultFinanceTemplate(
	organizationId: string,
	templateType: FinanceTemplateType,
) {
	return db.financeTemplate.findFirst({
		where: { organizationId, templateType, isDefault: true },
	});
}

/**
 * Create a new template
 */
export async function createFinanceTemplate(data: {
	organizationId: string;
	createdById: string;
	name: string;
	description?: string;
	templateType: FinanceTemplateType;
	content?: object;
	settings?: object;
	isDefault?: boolean;
}) {
	// If this is marked as default, unset other defaults of same type
	if (data.isDefault) {
		await db.financeTemplate.updateMany({
			where: {
				organizationId: data.organizationId,
				templateType: data.templateType,
				isDefault: true,
			},
			data: { isDefault: false },
		});
	}

	return db.financeTemplate.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			name: data.name,
			description: data.description,
			templateType: data.templateType,
			content: data.content ?? {},
			settings: data.settings ?? {},
			isDefault: data.isDefault ?? false,
		},
	});
}

/**
 * Update a template
 */
export async function updateFinanceTemplate(
	id: string,
	organizationId: string,
	data: Partial<{
		name: string;
		description: string;
		content: object;
		settings: object;
	}>,
) {
	const existing = await db.financeTemplate.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Template not found");
	}

	return db.financeTemplate.update({
		where: { id },
		data,
	});
}

/**
 * Set a template as default for its type
 */
export async function setDefaultFinanceTemplate(
	id: string,
	organizationId: string,
) {
	const template = await db.financeTemplate.findFirst({
		where: { id, organizationId },
		select: { id: true, templateType: true },
	});

	if (!template) {
		throw new Error("Template not found");
	}

	// Unset other defaults of same type
	await db.financeTemplate.updateMany({
		where: {
			organizationId,
			templateType: template.templateType,
			isDefault: true,
		},
		data: { isDefault: false },
	});

	// Set this as default
	return db.financeTemplate.update({
		where: { id },
		data: { isDefault: true },
	});
}

/**
 * Delete a template
 */
export async function deleteFinanceTemplate(id: string, organizationId: string) {
	const existing = await db.financeTemplate.findFirst({
		where: { id, organizationId },
		select: { id: true, isDefault: true },
	});

	if (!existing) {
		throw new Error("Template not found");
	}

	if (existing.isDefault) {
		throw new Error("Cannot delete default template");
	}

	return db.financeTemplate.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════════════════════
// ORGANIZATION FINANCE SETTINGS - إعدادات المالية للمؤسسة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get organization finance settings
 */
export async function getOrganizationFinanceSettings(organizationId: string) {
	return db.organizationFinanceSettings.findUnique({
		where: { organizationId },
	});
}

/**
 * Get or create organization finance settings (ensures settings always exist)
 */
export async function getOrCreateOrganizationFinanceSettings(
	organizationId: string,
) {
	let settings = await db.organizationFinanceSettings.findUnique({
		where: { organizationId },
	});

	if (!settings) {
		// Create default settings
		settings = await db.organizationFinanceSettings.create({
			data: {
				organizationId,
			},
		});
	}

	return settings;
}

/**
 * Update organization finance settings
 */
export async function updateOrganizationFinanceSettings(
	organizationId: string,
	data: {
		companyNameAr?: string;
		companyNameEn?: string;
		logo?: string;
		address?: string;
		addressEn?: string;
		phone?: string;
		email?: string;
		website?: string;
		taxNumber?: string;
		commercialReg?: string;
		bankName?: string;
		bankNameEn?: string;
		accountName?: string;
		iban?: string;
		accountNumber?: string;
		swiftCode?: string;
		headerText?: string;
		footerText?: string;
		thankYouMessage?: string;
		defaultVatPercent?: number;
		defaultCurrency?: string;
		defaultPaymentTerms?: string;
		defaultDeliveryTerms?: string;
		defaultWarrantyTerms?: string;
		quotationValidityDays?: number;
	},
) {
	return db.organizationFinanceSettings.upsert({
		where: { organizationId },
		create: {
			organizationId,
			...data,
		},
		update: data,
	});
}

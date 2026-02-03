import {
	updateClient,
	deleteClient,
	getClientById,
	getClientContacts,
	createClientContact,
	updateClientContact,
	deleteClientContact,
	setClientContactAsPrimary,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

// نوع العميل
const clientTypeEnum = z.enum(["INDIVIDUAL", "COMMERCIAL"]);

// العنوان الثانوي
const secondaryAddressSchema = z
	.object({
		streetAddress1: z.string().optional(),
		streetAddress2: z.string().optional(),
		city: z.string().optional(),
		region: z.string().optional(),
		postalCode: z.string().optional(),
		country: z.string().optional(),
	})
	.nullable()
	.optional();

export const updateClientProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/clients/{id}",
		tags: ["Finance", "Clients"],
		summary: "Update a client",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			// نوع العميل
			clientType: clientTypeEnum.optional(),
			// الأسماء
			firstName: z.string().optional(),
			lastName: z.string().optional(),
			businessName: z.string().optional(),
			name: z.string().min(1).optional(),
			company: z.string().optional(),
			// الاتصال
			phone: z.string().optional(),
			mobile: z.string().optional(),
			email: z.string().email().optional().or(z.literal("")),
			// العنوان
			address: z.string().optional(),
			streetAddress1: z.string().optional(),
			streetAddress2: z.string().optional(),
			city: z.string().optional(),
			region: z.string().optional(),
			postalCode: z.string().optional(),
			country: z.string().optional(),
			secondaryAddress: secondaryAddressSchema,
			// الحساب
			code: z.string().optional(),
			currency: z.string().optional(),
			displayLanguage: z.string().optional(),
			classification: z.array(z.string()).optional(),
			// الضريبة
			taxNumber: z.string().optional(),
			crNumber: z.string().optional(),
			// أخرى
			notes: z.string().optional(),
			isActive: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const { organizationId, id, ...data } = input;

		const client = await updateClient(id, organizationId, {
			...data,
			email: data.email || undefined,
		});

		return client;
	});

export const deleteClientProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/finance/clients/{id}",
		tags: ["Finance", "Clients"],
		summary: "Delete (deactivate) a client",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		await deleteClient(input.id, input.organizationId);

		return { success: true };
	});

export const getClient = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/clients/{id}",
		tags: ["Finance", "Clients"],
		summary: "Get a client by ID",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const client = await getClientById(input.id, input.organizationId);

		if (!client) {
			throw new ORPCError("NOT_FOUND", { message: "العميل غير موجود" });
		}

		return client;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT CONTACTS PROCEDURES - إجراءات جهات الاتصال
// ═══════════════════════════════════════════════════════════════════════════

export const listClientContacts = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/clients/{clientId}/contacts",
		tags: ["Finance", "Clients", "Contacts"],
		summary: "List all contacts for a client",
	})
	.input(
		z.object({
			organizationId: z.string(),
			clientId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		// التحقق من وجود العميل
		const client = await getClientById(input.clientId, input.organizationId);
		if (!client) {
			throw new ORPCError("NOT_FOUND", { message: "العميل غير موجود" });
		}

		const contacts = await getClientContacts(input.clientId);
		return contacts;
	});

export const createClientContactProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/clients/{clientId}/contacts",
		tags: ["Finance", "Clients", "Contacts"],
		summary: "Create a new contact for a client",
	})
	.input(
		z.object({
			organizationId: z.string(),
			clientId: z.string(),
			name: z.string().min(1, "اسم جهة الاتصال مطلوب"),
			position: z.string().optional(),
			phone: z.string().optional(),
			mobile: z.string().optional(),
			email: z.string().email().optional().or(z.literal("")),
			isPrimary: z.boolean().optional().default(false),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		// التحقق من وجود العميل
		const client = await getClientById(input.clientId, input.organizationId);
		if (!client) {
			throw new ORPCError("NOT_FOUND", { message: "العميل غير موجود" });
		}

		const contact = await createClientContact({
			clientId: input.clientId,
			name: input.name,
			position: input.position,
			phone: input.phone,
			mobile: input.mobile,
			email: input.email || undefined,
			isPrimary: input.isPrimary,
			notes: input.notes,
		});

		return contact;
	});

export const updateClientContactProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/clients/{clientId}/contacts/{contactId}",
		tags: ["Finance", "Clients", "Contacts"],
		summary: "Update a client contact",
	})
	.input(
		z.object({
			organizationId: z.string(),
			clientId: z.string(),
			contactId: z.string(),
			name: z.string().min(1).optional(),
			position: z.string().optional(),
			phone: z.string().optional(),
			mobile: z.string().optional(),
			email: z.string().email().optional().or(z.literal("")),
			isPrimary: z.boolean().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		// التحقق من وجود العميل
		const client = await getClientById(input.clientId, input.organizationId);
		if (!client) {
			throw new ORPCError("NOT_FOUND", { message: "العميل غير موجود" });
		}

		const { organizationId, clientId, contactId, ...data } = input;

		const contact = await updateClientContact(contactId, clientId, {
			...data,
			email: data.email || undefined,
		});

		return contact;
	});

export const deleteClientContactProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/finance/clients/{clientId}/contacts/{contactId}",
		tags: ["Finance", "Clients", "Contacts"],
		summary: "Delete a client contact",
	})
	.input(
		z.object({
			organizationId: z.string(),
			clientId: z.string(),
			contactId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		// التحقق من وجود العميل
		const client = await getClientById(input.clientId, input.organizationId);
		if (!client) {
			throw new ORPCError("NOT_FOUND", { message: "العميل غير موجود" });
		}

		await deleteClientContact(input.contactId, input.clientId);

		return { success: true };
	});

export const setClientContactAsPrimaryProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/clients/{clientId}/contacts/{contactId}/primary",
		tags: ["Finance", "Clients", "Contacts"],
		summary: "Set a contact as primary",
	})
	.input(
		z.object({
			organizationId: z.string(),
			clientId: z.string(),
			contactId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		// التحقق من وجود العميل
		const client = await getClientById(input.clientId, input.organizationId);
		if (!client) {
			throw new ORPCError("NOT_FOUND", { message: "العميل غير موجود" });
		}

		const contact = await setClientContactAsPrimary(input.contactId, input.clientId);

		return contact;
	});

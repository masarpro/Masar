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
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_DESC, MAX_CODE, MAX_PHONE, MAX_ADDRESS,
	idString, optionalTrimmed,
} from "../../../lib/validation-constants";

// نوع العميل
const clientTypeEnum = z.enum(["INDIVIDUAL", "COMMERCIAL"]);

// العنوان الثانوي
const secondaryAddressSchema = z
	.object({
		streetAddress1: z.string().trim().max(MAX_ADDRESS).optional(),
		streetAddress2: z.string().trim().max(MAX_ADDRESS).optional(),
		city: z.string().trim().max(MAX_NAME).optional(),
		region: z.string().trim().max(MAX_NAME).optional(),
		postalCode: z.string().trim().max(20).optional(),
		country: z.string().trim().max(3).optional(),
	})
	.nullable()
	.optional();

export const updateClientProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/clients/{id}",
		tags: ["Finance", "Clients"],
		summary: "Update a client",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			// نوع العميل
			clientType: clientTypeEnum.optional(),
			// الأسماء
			firstName: optionalTrimmed(MAX_NAME),
			lastName: optionalTrimmed(MAX_NAME),
			businessName: optionalTrimmed(MAX_NAME),
			name: z.string().trim().min(1).max(MAX_NAME).optional(),
			company: optionalTrimmed(MAX_NAME),
			// الاتصال
			phone: z.string().trim().max(MAX_PHONE).optional(),
			mobile: z.string().trim().max(MAX_PHONE).optional(),
			email: z.string().trim().email().max(254).optional().or(z.literal("")),
			// العنوان
			address: optionalTrimmed(MAX_ADDRESS),
			streetAddress1: optionalTrimmed(MAX_ADDRESS),
			streetAddress2: optionalTrimmed(MAX_ADDRESS),
			city: optionalTrimmed(MAX_NAME),
			region: optionalTrimmed(MAX_NAME),
			postalCode: z.string().trim().max(20).optional(),
			country: z.string().trim().max(3).optional(),
			secondaryAddress: secondaryAddressSchema,
			// الحساب
			code: z.string().trim().max(MAX_CODE).optional(),
			currency: z.string().trim().max(3).optional(),
			displayLanguage: z.string().trim().max(10).optional(),
			classification: z.array(z.string().trim().max(MAX_NAME)).optional(),
			// الضريبة
			taxNumber: z.string().trim().max(MAX_CODE).optional(),
			crNumber: z.string().trim().max(MAX_CODE).optional(),
			// أخرى
			notes: optionalTrimmed(MAX_DESC),
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

export const deleteClientProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/finance/clients/{id}",
		tags: ["Finance", "Clients"],
		summary: "Delete (deactivate) a client",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
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

export const getClient = subscriptionProcedure
	.route({
		method: "GET",
		path: "/finance/clients/{id}",
		tags: ["Finance", "Clients"],
		summary: "Get a client by ID",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
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

export const listClientContacts = subscriptionProcedure
	.route({
		method: "GET",
		path: "/finance/clients/{clientId}/contacts",
		tags: ["Finance", "Clients", "Contacts"],
		summary: "List all contacts for a client",
	})
	.input(
		z.object({
			organizationId: idString(),
			clientId: idString(),
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

export const createClientContactProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/clients/{clientId}/contacts",
		tags: ["Finance", "Clients", "Contacts"],
		summary: "Create a new contact for a client",
	})
	.input(
		z.object({
			organizationId: idString(),
			clientId: idString(),
			name: z.string().trim().min(1, "اسم جهة الاتصال مطلوب").max(MAX_NAME),
			position: optionalTrimmed(MAX_NAME),
			phone: z.string().trim().max(MAX_PHONE).optional(),
			mobile: z.string().trim().max(MAX_PHONE).optional(),
			email: z.string().trim().email().max(254).optional().or(z.literal("")),
			isPrimary: z.boolean().optional().default(false),
			notes: optionalTrimmed(MAX_DESC),
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

export const updateClientContactProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/clients/{clientId}/contacts/{contactId}",
		tags: ["Finance", "Clients", "Contacts"],
		summary: "Update a client contact",
	})
	.input(
		z.object({
			organizationId: idString(),
			clientId: idString(),
			contactId: idString(),
			name: z.string().trim().min(1).max(MAX_NAME).optional(),
			position: optionalTrimmed(MAX_NAME),
			phone: z.string().trim().max(MAX_PHONE).optional(),
			mobile: z.string().trim().max(MAX_PHONE).optional(),
			email: z.string().trim().email().max(254).optional().or(z.literal("")),
			isPrimary: z.boolean().optional(),
			notes: optionalTrimmed(MAX_DESC),
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

export const deleteClientContactProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/finance/clients/{clientId}/contacts/{contactId}",
		tags: ["Finance", "Clients", "Contacts"],
		summary: "Delete a client contact",
	})
	.input(
		z.object({
			organizationId: idString(),
			clientId: idString(),
			contactId: idString(),
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

export const setClientContactAsPrimaryProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/clients/{clientId}/contacts/{contactId}/primary",
		tags: ["Finance", "Clients", "Contacts"],
		summary: "Set a contact as primary",
	})
	.input(
		z.object({
			organizationId: idString(),
			clientId: idString(),
			contactId: idString(),
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

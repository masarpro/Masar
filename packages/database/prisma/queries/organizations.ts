import type { z } from "zod";
import { db } from "../client";
import type { OrganizationSchema } from "../zod";
import slugify from "@sindresorhus/slugify";
import { nanoid } from "nanoid";
import { createDefaultRolesInTx } from "./roles";

export async function getOrganizations({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	return db.organization
		.findMany({
			where: query
				? {
						OR: [
							{
								name: {
									contains: query,
									mode: "insensitive",
								},
							},
						],
					}
				: undefined,
			include: {
				_count: {
					select: {
						members: true,
					},
				},
			},
			take: limit,
			skip: offset,
		})
		.then((res) =>
			res.map((org) => ({
				...org,
				membersCount: org._count.members,
			})),
		);
}

export async function countAllOrganizations({ query }: { query?: string }) {
	return db.organization.count({
		where: query
			? {
					OR: [
						{
							name: {
								contains: query,
								mode: "insensitive",
							},
						},
					],
				}
			: undefined,
	});
}

export async function getOrganizationById(id: string) {
	return db.organization.findUnique({
		where: { id },
		include: {
			members: true,
			invitations: true,
		},
	});
}

export async function getInvitationById(id: string) {
	return db.invitation.findUnique({
		where: { id },
		include: {
			organization: true,
		},
	});
}

export async function getOrganizationBySlug(slug: string) {
	return db.organization.findUnique({
		where: { slug },
	});
}

export async function getOrganizationMembership(
	organizationId: string,
	userId: string,
) {
	return db.member.findUnique({
		where: {
			organizationId_userId: {
				organizationId,
				userId,
			},
		},
		include: {
			organization: true,
		},
	});
}

export async function getOrganizationWithPurchasesAndMembersCount(
	organizationId: string,
) {
	const organization = await db.organization.findUnique({
		where: {
			id: organizationId,
		},
		include: {
			purchases: true,
			_count: {
				select: {
					members: true,
				},
			},
		},
	});

	return organization
		? {
				...organization,
				membersCount: organization._count.members,
			}
		: null;
}

export async function getPendingInvitationByEmail(email: string) {
	return db.invitation.findFirst({
		where: {
			email,
			status: "pending",
		},
	});
}

export async function updateOrganization(
	organization: Partial<z.infer<typeof OrganizationSchema>> & { id: string },
) {
	return db.organization.update({
		where: {
			id: organization.id,
		},
		data: organization,
	});
}

/**
 * Get the count of organizations a user belongs to
 */
export async function getUserOrganizationsCount(userId: string) {
	return db.member.count({
		where: { userId },
	});
}

/**
 * Generate a unique organization slug
 */
export async function generateUniqueSlug(name: string): Promise<string> {
	const baseSlug = slugify(name, { lowercase: true });

	let slug = baseSlug;

	for (let i = 0; i < 5; i++) {
		const existing = await db.organization.findUnique({
			where: { slug },
			select: { id: true },
		});

		if (!existing) {
			return slug;
		}

		slug = `${baseSlug}-${nanoid(5)}`;
	}

	// Fallback: use nanoid only
	return nanoid(10);
}

/**
 * Create an organization for a user (used for auto-creation on signup)
 */
export async function createOrganizationForUser({
	userId,
	userName,
	organizationName,
}: {
	userId: string;
	userName: string;
	organizationName?: string;
}) {
	const name = organizationName || `منشأة ${userName}` || "منشأتي";
	const slug = await generateUniqueSlug(name);
	const now = new Date();

	return db.$transaction(async (tx) => {
		// Create the organization
		const organization = await tx.organization.create({
			data: {
				name,
				slug,
				createdAt: now,
				ownerId: userId,
			},
		});

		// Create the membership with owner role (Better Auth requires this)
		await tx.member.create({
			data: {
				organizationId: organization.id,
				userId,
				role: "owner",
				createdAt: now,
			},
		});

		// Create default roles (including OWNER)
		const defaultRoles = await createDefaultRolesInTx(tx, organization.id);
		const ownerRole = defaultRoles.find((r) => r.type === "OWNER");

		// Update user's organizationId and assign OWNER role
		await tx.user.update({
			where: { id: userId },
			data: {
				organizationId: organization.id,
				accountType: "OWNER",
				organizationRoleId: ownerRole?.id,
			},
		});

		return organization;
	});
}

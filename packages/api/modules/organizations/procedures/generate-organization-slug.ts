import { ORPCError } from "@orpc/client";
import { getOrganizationBySlug } from "@repo/database";
import slugify from "@sindresorhus/slugify";
import { nanoid } from "nanoid";
import { z } from "zod";
import { enforceRateLimit, createIpRateLimitKey, RATE_LIMITS } from "../../../lib/rate-limit";
import { publicProcedure } from "../../../orpc/procedures";

export const generateOrganizationSlug = publicProcedure
	.route({
		method: "GET",
		path: "/organizations/generate-slug",
		tags: ["Organizations"],
		summary: "Generate organization slug",
		description: "Generate a unique slug from an organization name",
	})
	.input(
		z.object({
			name: z.string(),
		}),
	)
	.handler(async ({ input: { name }, context: { headers } }) => {
		const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
		await enforceRateLimit(createIpRateLimitKey(ip, "generateOrganizationSlug"), RATE_LIMITS.READ);
		const baseSlug = slugify(name, {
			lowercase: true,
		});

		let slug = baseSlug;
		let hasAvailableSlug = false;

		for (let i = 0; i < 3; i++) {
			const existing = await getOrganizationBySlug(slug);

			if (!existing) {
				hasAvailableSlug = true;
				break;
			}

			slug = `${baseSlug}-${nanoid(5)}`;
		}

		if (!hasAvailableSlug) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}

		return { slug };
	});

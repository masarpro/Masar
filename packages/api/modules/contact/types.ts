import { z } from "zod";
import { MAX_NAME, MAX_DESC, MAX_EMAIL } from "../../lib/validation-constants";

export const contactFormSchema = z.object({
	email: z.string().trim().email().max(MAX_EMAIL),
	name: z.string().trim().min(3).max(MAX_NAME),
	message: z.string().trim().min(10).max(MAX_DESC),
	turnstileToken: z.string().min(1).max(5000),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

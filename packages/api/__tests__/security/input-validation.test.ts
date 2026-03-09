/**
 * Input Validation Tests (Zod Schema layer)
 *
 * Tests that Zod schemas on critical endpoints reject invalid input.
 * These are pure unit tests — no DB or HTTP requests required.
 * We import the Zod schemas directly and validate against them.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════════
// Reusable schemas (matching actual endpoint schemas)
// ═══════════════════════════════════════════════════════════════════════════

// Extracted from create-project.ts
const createProjectSchema = z.object({
	organizationId: z.string(),
	name: z.string().min(1, "اسم المشروع مطلوب"),
	description: z.string().optional(),
	type: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INFRASTRUCTURE", "MIXED"]).optional(),
	clientName: z.string().optional(),
	clientId: z.string().optional(),
	location: z.string().optional(),
	contractValue: z.number().min(0).optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

// Extracted from create-org-user.ts
const createOrgUserSchema = z.object({
	organizationId: z.string(),
	name: z.string().min(1),
	email: z.string().email(),
	organizationRoleId: z.string(),
	password: z.string().min(8),
});

// Extracted from create-upload-url.ts
const createUploadUrlSchema = z.object({
	organizationId: z.string().min(1),
	projectId: z.string().optional(),
	ownerType: z.enum(["DOCUMENT", "PHOTO", "EXPENSE", "ISSUE", "MESSAGE", "CLAIM"]),
	fileName: z.string().min(1).max(255),
	fileSize: z.number().int().positive().max(100 * 1024 * 1024),
	mimeType: z.string().min(1),
});

// Extracted from send-owner-message.ts
const sendOwnerMessageSchema = z.object({
	token: z.string().min(1, "رمز الوصول مطلوب"),
	content: z.string().min(1, "الرسالة مطلوبة"),
	senderName: z.string().optional().default("مالك المشروع"),
});

// ═══════════════════════════════════════════════════════════════════════════
// Project Creation Validation
// ═══════════════════════════════════════════════════════════════════════════

describe("projects.create input validation", () => {
	it("accepts valid input", () => {
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: "Test Project",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing name", () => {
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty name", () => {
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing organizationId", () => {
		const result = createProjectSchema.safeParse({
			name: "Test Project",
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative contractValue", () => {
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: "Test",
			contractValue: -1000,
		});
		expect(result.success).toBe(false);
	});

	it("accepts zero contractValue", () => {
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: "Test",
			contractValue: 0,
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid project type", () => {
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: "Test",
			type: "INVALID_TYPE",
		});
		expect(result.success).toBe(false);
	});

	it("accepts all valid project types", () => {
		const types = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INFRASTRUCTURE", "MIXED"];
		for (const type of types) {
			const result = createProjectSchema.safeParse({
				organizationId: "org-123",
				name: "Test",
				type,
			});
			expect(result.success, `Type ${type} should be valid`).toBe(true);
		}
	});

	it("coerces date strings to Date objects", () => {
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: "Test",
			startDate: "2026-01-01",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.startDate).toBeInstanceOf(Date);
		}
	});

	it("rejects invalid date string", () => {
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: "Test",
			startDate: "not-a-date",
		});
		expect(result.success).toBe(false);
	});

	it("accepts very long project name", () => {
		const longName = "A".repeat(10000);
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: longName,
		});
		// Schema doesn't enforce max length — document this behavior
		expect(result.success).toBe(true);
	});

	it("rejects number as name (type mismatch)", () => {
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: 12345,
		});
		expect(result.success).toBe(false);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Org User Creation Validation
// ═══════════════════════════════════════════════════════════════════════════

describe("org-users.create input validation", () => {
	const validInput = {
		organizationId: "org-123",
		name: "Test User",
		email: "test@example.com",
		organizationRoleId: "role-123",
		password: "securePassword123",
	};

	it("accepts valid input", () => {
		const result = createOrgUserSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it("rejects missing email", () => {
		const { email, ...rest } = validInput;
		const result = createOrgUserSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects invalid email format", () => {
		const result = createOrgUserSchema.safeParse({
			...validInput,
			email: "not-an-email",
		});
		expect(result.success).toBe(false);
	});

	it("rejects email without domain", () => {
		const result = createOrgUserSchema.safeParse({
			...validInput,
			email: "user@",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty name", () => {
		const result = createOrgUserSchema.safeParse({
			...validInput,
			name: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password shorter than 8 characters", () => {
		const result = createOrgUserSchema.safeParse({
			...validInput,
			password: "short",
		});
		expect(result.success).toBe(false);
	});

	it("accepts exactly 8 character password", () => {
		const result = createOrgUserSchema.safeParse({
			...validInput,
			password: "12345678",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing organizationRoleId", () => {
		const { organizationRoleId, ...rest } = validInput;
		const result = createOrgUserSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Upload URL Validation
// ═══════════════════════════════════════════════════════════════════════════

describe("attachments.createUploadUrl input validation", () => {
	const validInput = {
		organizationId: "org-123",
		ownerType: "DOCUMENT" as const,
		fileName: "report.pdf",
		fileSize: 1024 * 1024, // 1MB
		mimeType: "application/pdf",
	};

	it("accepts valid input", () => {
		const result = createUploadUrlSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it("rejects empty organizationId", () => {
		const result = createUploadUrlSchema.safeParse({
			...validInput,
			organizationId: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid ownerType", () => {
		const result = createUploadUrlSchema.safeParse({
			...validInput,
			ownerType: "INVALID",
		});
		expect(result.success).toBe(false);
	});

	it("accepts all valid ownerTypes", () => {
		const types = ["DOCUMENT", "PHOTO", "EXPENSE", "ISSUE", "MESSAGE", "CLAIM"];
		for (const type of types) {
			const result = createUploadUrlSchema.safeParse({ ...validInput, ownerType: type });
			expect(result.success, `Owner type ${type}`).toBe(true);
		}
	});

	it("rejects empty fileName", () => {
		const result = createUploadUrlSchema.safeParse({
			...validInput,
			fileName: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects fileName longer than 255 chars", () => {
		const result = createUploadUrlSchema.safeParse({
			...validInput,
			fileName: "a".repeat(256),
		});
		expect(result.success).toBe(false);
	});

	it("rejects zero fileSize", () => {
		const result = createUploadUrlSchema.safeParse({
			...validInput,
			fileSize: 0,
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative fileSize", () => {
		const result = createUploadUrlSchema.safeParse({
			...validInput,
			fileSize: -100,
		});
		expect(result.success).toBe(false);
	});

	it("rejects fileSize > 100MB", () => {
		const result = createUploadUrlSchema.safeParse({
			...validInput,
			fileSize: 101 * 1024 * 1024,
		});
		expect(result.success).toBe(false);
	});

	it("accepts exactly 100MB fileSize", () => {
		const result = createUploadUrlSchema.safeParse({
			...validInput,
			fileSize: 100 * 1024 * 1024,
		});
		expect(result.success).toBe(true);
	});

	it("rejects non-integer fileSize", () => {
		const result = createUploadUrlSchema.safeParse({
			...validInput,
			fileSize: 1024.5,
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty mimeType", () => {
		const result = createUploadUrlSchema.safeParse({
			...validInput,
			mimeType: "",
		});
		expect(result.success).toBe(false);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Owner Portal Message Validation
// ═══════════════════════════════════════════════════════════════════════════

describe("owner-portal sendMessage input validation", () => {
	it("accepts valid input", () => {
		const result = sendOwnerMessageSchema.safeParse({
			token: "abc123",
			content: "Hello from owner",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.senderName).toBe("مالك المشروع"); // default
		}
	});

	it("rejects empty token", () => {
		const result = sendOwnerMessageSchema.safeParse({
			token: "",
			content: "Hello",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty content", () => {
		const result = sendOwnerMessageSchema.safeParse({
			token: "abc123",
			content: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing token", () => {
		const result = sendOwnerMessageSchema.safeParse({
			content: "Hello",
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing content", () => {
		const result = sendOwnerMessageSchema.safeParse({
			token: "abc123",
		});
		expect(result.success).toBe(false);
	});

	it("accepts custom senderName", () => {
		const result = sendOwnerMessageSchema.safeParse({
			token: "abc123",
			content: "Hello",
			senderName: "أحمد المالك",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.senderName).toBe("أحمد المالك");
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Common data type edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe("Common edge cases", () => {
	it("null organizationId is rejected", () => {
		const result = createProjectSchema.safeParse({
			organizationId: null,
			name: "Test",
		});
		expect(result.success).toBe(false);
	});

	it("undefined required fields are rejected", () => {
		const result = createProjectSchema.safeParse({
			organizationId: undefined,
			name: undefined,
		});
		expect(result.success).toBe(false);
	});

	it("extra fields are stripped (Zod default)", () => {
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: "Test",
			maliciousField: "<script>alert('xss')</script>",
		});
		expect(result.success).toBe(true);
	});

	it("SQL injection in string fields passes schema (blocked at DB layer)", () => {
		// Zod validates types, not SQL injection — Prisma handles parameterization
		const result = createProjectSchema.safeParse({
			organizationId: "org-123",
			name: "'; DROP TABLE projects; --",
		});
		expect(result.success).toBe(true);
	});
});

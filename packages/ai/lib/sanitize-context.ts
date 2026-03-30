// ═══════════════════════════════════════════════════════════════
// Prompt Injection Sanitization
// Strips known injection patterns from user-provided context.
// Not a perfect defense — prompt injection is an open problem.
// This + permission checks provide sufficient protection for beta.
// ═══════════════════════════════════════════════════════════════

const MAX_CONTEXT_LENGTH = 5000;

const INJECTION_PATTERNS = [
	/ignore.*previous.*instructions/gi,
	/ignore.*all.*instructions/gi,
	/you are now/gi,
	/new instructions:/gi,
	/system:/gi,
	/\[INST\]/gi,
	/<\/?system>/gi,
	/<\/?prompt>/gi,
	/assistant:/gi,
	/human:/gi,
];

/**
 * Sanitize user-provided context before injecting into system prompt.
 * Strips known prompt injection patterns and enforces length limit.
 */
export function sanitizeUserContext(text: string): string {
	if (!text) return "";

	let sanitized = text;
	for (const pattern of INJECTION_PATTERNS) {
		sanitized = sanitized.replace(pattern, "[filtered]");
	}

	return sanitized.slice(0, MAX_CONTEXT_LENGTH);
}

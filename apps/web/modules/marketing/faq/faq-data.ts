export const FAQ_CATEGORIES = [
	"general",
	"plans",
	"projects",
	"finance",
	"quantities",
	"subcontractors",
	"hr",
	"assistant",
	"security",
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export const FAQ_ITEMS: { id: string; category: FaqCategory }[] = [
	{ id: "g1", category: "general" },
	{ id: "g2", category: "general" },
	{ id: "g3", category: "general" },
	{ id: "g4", category: "general" },
	{ id: "g5", category: "general" },
	{ id: "g6", category: "general" },
	{ id: "g7", category: "general" },
	{ id: "g8", category: "general" },
	{ id: "p1", category: "plans" },
	{ id: "p2", category: "plans" },
	{ id: "p3", category: "plans" },
	{ id: "p4", category: "plans" },
	{ id: "p5", category: "plans" },
	{ id: "p6", category: "plans" },
	{ id: "p7", category: "plans" },
	{ id: "pr1", category: "projects" },
	{ id: "pr2", category: "projects" },
	{ id: "pr3", category: "projects" },
	{ id: "pr4", category: "projects" },
	{ id: "pr5", category: "projects" },
	{ id: "pr6", category: "projects" },
	{ id: "pr7", category: "projects" },
	{ id: "pr8", category: "projects" },
	{ id: "f1", category: "finance" },
	{ id: "f2", category: "finance" },
	{ id: "f3", category: "finance" },
	{ id: "f4", category: "finance" },
	{ id: "f5", category: "finance" },
	{ id: "f6", category: "finance" },
	{ id: "f7", category: "finance" },
	{ id: "f8", category: "finance" },
	{ id: "q1", category: "quantities" },
	{ id: "q2", category: "quantities" },
	{ id: "q3", category: "quantities" },
	{ id: "q4", category: "quantities" },
	{ id: "q5", category: "quantities" },
	{ id: "q6", category: "quantities" },
	{ id: "q7", category: "quantities" },
	{ id: "s1", category: "subcontractors" },
	{ id: "s2", category: "subcontractors" },
	{ id: "s3", category: "subcontractors" },
	{ id: "s4", category: "subcontractors" },
	{ id: "h1", category: "hr" },
	{ id: "h2", category: "hr" },
	{ id: "h3", category: "hr" },
	{ id: "h4", category: "hr" },
	{ id: "a1", category: "assistant" },
	{ id: "a2", category: "assistant" },
	{ id: "a3", category: "assistant" },
	{ id: "sec1", category: "security" },
	{ id: "sec2", category: "security" },
	{ id: "sec3", category: "security" },
	{ id: "sec4", category: "security" },
	{ id: "sec5", category: "security" },
	{ id: "sec6", category: "security" },
];

// رقم واتساب للتواصل — يُضبط عبر متغير البيئة العام
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function getWhatsAppLink(message: string): string | null {
	if (!WHATSAPP_NUMBER) {
		return null;
	}
	const digits = WHATSAPP_NUMBER.replace(/[^\d]/g, "");
	return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export interface QuoteData {
	// Client
	clientName: string;
	clientAddress: string;
	clientPhone: string;
	clientEmail: string;

	// Quote meta
	quoteNumber: string;
	issueDate: string; // YYYY-MM-DD
	validUntil: string; // YYYY-MM-DD

	// Project
	projectName: string;
	projectAddress: string;

	// VAT
	includeVAT: boolean;

	// Terms
	paymentTerms: string;
	executionDuration: string;
	warranty: string;
	notes: string;
}

export const DEFAULT_QUOTE: QuoteData = {
	clientName: "",
	clientAddress: "",
	clientPhone: "",
	clientEmail: "",
	quoteNumber: "",
	issueDate: new Date().toISOString().slice(0, 10),
	validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
		.toISOString()
		.slice(0, 10),
	projectName: "",
	projectAddress: "",
	includeVAT: true,
	paymentTerms: "30% مقدم عند توقيع العقد، 60% أثناء التنفيذ، 10% عند التسليم النهائي",
	executionDuration: "60 يوم عمل من تاريخ توقيع العقد",
	warranty: "ضمان سنة كاملة على التشطيبات والتنفيذ",
	notes: "",
};

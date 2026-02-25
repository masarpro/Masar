// Pricing Module Router
// Unified pre-contract pricing: Cost Studies + Quotations
// Re-exports from existing modules — no code duplication

import { quantitiesRouter } from "../quantities/router";

import { listQuotations, getQuotation } from "../finance/procedures/list-quotations";
import {
	createQuotationProcedure,
	updateQuotationProcedure,
	updateQuotationItemsProcedure,
	updateQuotationStatusProcedure,
	deleteQuotationProcedure,
	convertQuotationToInvoiceProcedure,
} from "../finance/procedures/create-quotation";

export const pricingRouter = {
	// Cost Studies (دراسات الكميات) — all existing quantities routes
	studies: { ...quantitiesRouter },

	// Quotations (عروض الأسعار) — all quotation procedures
	quotations: {
		list: listQuotations,
		getById: getQuotation,
		create: createQuotationProcedure,
		update: updateQuotationProcedure,
		updateItems: updateQuotationItemsProcedure,
		updateStatus: updateQuotationStatusProcedure,
		delete: deleteQuotationProcedure,
		convertToInvoice: convertQuotationToInvoiceProcedure,
	},
};

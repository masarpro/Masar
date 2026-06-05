export interface CreateInvoiceFormProps {
	organizationId: string;
	organizationSlug: string;
	/** فاتورة معتمدة نريد تعديلها — تُنشئ/تستأنف مسودة تعديل مرتبطة بها */
	invoiceId?: string;
	/** مسودة staging قائمة نريد استئنافها مباشرةً */
	draftId?: string;
}

export interface InvoiceItem {
	id: string;
	description: string;
	quantity: number;
	unit: string;
	unitPrice: number;
}

export type ColumnKey = "index" | "description" | "unit" | "unitPrice" | "quantity" | "total" | "actions";

export const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
	"index", "description", "unit", "unitPrice", "quantity", "total", "actions",
];

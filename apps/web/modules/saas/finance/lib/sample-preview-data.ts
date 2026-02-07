/**
 * Sample data for template preview in the editor
 */

import type { TemplateSettings } from "./default-templates";

export interface SampleQuotationData {
	quotationNo: string;
	createdAt: Date;
	validUntil: Date;
	status: string;
	clientName: string;
	clientCompany?: string;
	clientPhone?: string;
	clientEmail?: string;
	clientAddress?: string;
	clientTaxNumber?: string;
	items: Array<{
		description: string;
		quantity: number;
		unit?: string;
		unitPrice: number;
		totalPrice: number;
	}>;
	subtotal: number;
	discountPercent: number;
	discountAmount: number;
	vatPercent: number;
	vatAmount: number;
	totalAmount: number;
	paymentTerms?: string;
	deliveryTerms?: string;
	warrantyTerms?: string;
	notes?: string;
}

export interface SampleInvoiceData {
	invoiceNo: string;
	issueDate: Date;
	dueDate: Date;
	status: string;
	invoiceType: string;
	clientName: string;
	clientCompany?: string;
	clientPhone?: string;
	clientEmail?: string;
	clientAddress?: string;
	clientTaxNumber?: string;
	items: Array<{
		description: string;
		quantity: number;
		unit?: string;
		unitPrice: number;
		totalPrice: number;
	}>;
	subtotal: number;
	discountPercent: number;
	discountAmount: number;
	vatPercent: number;
	vatAmount: number;
	totalAmount: number;
	paidAmount?: number;
	paymentTerms?: string;
	notes?: string;
	sellerTaxNumber?: string;
}

/**
 * Get sample quotation data for template preview
 */
export function getSampleQuotationData(settings?: Partial<TemplateSettings>): SampleQuotationData {
	const vatPercent = settings?.vatPercent || 15;
	const subtotal = 8500;
	const discountPercent = 5;
	const discountAmount = subtotal * (discountPercent / 100);
	const afterDiscount = subtotal - discountAmount;
	const vatAmount = afterDiscount * (vatPercent / 100);
	const totalAmount = afterDiscount + vatAmount;

	return {
		quotationNo: "QT-2024-0001",
		createdAt: new Date(),
		validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		status: "DRAFT",
		clientName: "أحمد محمد العبدالله",
		clientCompany: "شركة النجاح للتقنية",
		clientPhone: "0501234567",
		clientEmail: "ahmad@example.com",
		clientAddress: "الرياض، حي العليا، شارع التخصصي، المملكة العربية السعودية",
		clientTaxNumber: "300123456789003",
		items: [
			{
				description: "خدمة استشارية تقنية - تحليل وتصميم النظام",
				quantity: 5,
				unit: "ساعة",
				unitPrice: 500,
				totalPrice: 2500,
			},
			{
				description: "تصميم وتطوير واجهة المستخدم",
				quantity: 1,
				unit: "مشروع",
				unitPrice: 3000,
				totalPrice: 3000,
			},
			{
				description: "صيانة ودعم فني شهري",
				quantity: 3,
				unit: "شهر",
				unitPrice: 1000,
				totalPrice: 3000,
			},
		],
		subtotal,
		discountPercent,
		discountAmount,
		vatPercent,
		vatAmount,
		totalAmount,
		paymentTerms: "الدفع خلال 30 يوم من تاريخ الفاتورة",
		deliveryTerms: "التسليم خلال أسبوعين من تاريخ الموافقة",
		warrantyTerms: "ضمان لمدة سنة على جميع الخدمات",
		notes: "نشكركم على ثقتكم بنا ونتطلع للعمل معكم",
	};
}

/**
 * Get sample invoice data for template preview
 */
export function getSampleInvoiceData(settings?: Partial<TemplateSettings>): SampleInvoiceData {
	const vatPercent = settings?.vatPercent || 15;
	const subtotal = 12500;
	const discountPercent = 0;
	const discountAmount = 0;
	const afterDiscount = subtotal - discountAmount;
	const vatAmount = afterDiscount * (vatPercent / 100);
	const totalAmount = afterDiscount + vatAmount;

	return {
		invoiceNo: "INV-2024-0001",
		issueDate: new Date(),
		dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		status: "ISSUED",
		invoiceType: "STANDARD",
		clientName: "محمد عبدالرحمن",
		clientCompany: "مؤسسة الرواد للتجارة",
		clientPhone: "0509876543",
		clientEmail: "mohammed@example.com",
		clientAddress: "جدة، حي الروضة، طريق الملك فهد، المملكة العربية السعودية",
		clientTaxNumber: "300987654321003",
		items: [
			{
				description: "تطوير تطبيق موبايل - المرحلة الأولى",
				quantity: 1,
				unit: "مشروع",
				unitPrice: 8000,
				totalPrice: 8000,
			},
			{
				description: "تصميم الهوية البصرية",
				quantity: 1,
				unit: "مشروع",
				unitPrice: 2500,
				totalPrice: 2500,
			},
			{
				description: "استضافة وخدمات سحابية - سنة",
				quantity: 1,
				unit: "سنة",
				unitPrice: 2000,
				totalPrice: 2000,
			},
		],
		subtotal,
		discountPercent,
		discountAmount,
		vatPercent,
		vatAmount,
		totalAmount,
		paidAmount: 0,
		paymentTerms: "الدفع خلال 15 يوم من تاريخ الفاتورة",
		notes: "شكراً لتعاملكم معنا",
		sellerTaxNumber: "300111222333003",
	};
}

/**
 * Get sample data based on template type
 */
export function getSampleData(
	templateType: "quotation" | "invoice" | "letter",
	settings?: Partial<TemplateSettings>
): SampleQuotationData | SampleInvoiceData {
	if (templateType === "invoice") {
		return getSampleInvoiceData(settings);
	}
	return getSampleQuotationData(settings);
}

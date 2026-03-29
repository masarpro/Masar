// ══════════════════════════════════��════════════════════════════════════════
// PDF Generator (pdfkit)
// ═════════════════════���═════════════════════════════════════════════════════

import { numberToArabicWords } from "@repo/utils";
import {
	createPDFDocument,
	renderHeader,
	registerFooter,
	renderSectionTitle,
	renderKeyValuePairs,
	renderTable,
	renderSummaryBoxes,
	renderProgressBar,
	docToBuffer,
	formatDate,
	formatDateShort,
	formatCurrency,
	formatNumber,
	getStatusLabel,
} from "./pdf-shared";

/**
 * PDF generation configuration
 */
export interface PDFConfig {
	title: string;
	subtitle?: string;
	language: "ar" | "en";
	orientation?: "portrait" | "landscape";
}

/**
 * Update PDF data structure
 */
export interface UpdatePDFData {
	projectName: string;
	updateDate: Date;
	type: string;
	title: string;
	body: string;
	photos?: { url: string; caption?: string }[];
	companyName: string;
	companyLogo?: string;
}

/**
 * Claim PDF data structure
 */
export interface ClaimPDFData {
	projectName: string;
	claimNumber: number;
	periodStart: Date;
	periodEnd: Date;
	amount: number;
	currency: string;
	status: string;
	items?: { description: string; amount: number }[];
	companyName: string;
	companyLogo?: string;
}

/**
 * Weekly Report PDF data structure
 */
export interface WeeklyReportPDFData {
	projectName: string;
	weekStart: Date;
	weekEnd: Date;
	updates: {
		date: Date;
		type: string;
		title: string;
	}[];
	expenses: {
		category: string;
		amount: number;
	}[];
	issues: {
		title: string;
		status: string;
	}[];
	progress: number;
	companyName: string;
	companyLogo?: string;
}

/**
 * Generate Update PDF
 */
export async function generateUpdatePDF(
	data: UpdatePDFData,
	config: PDFConfig,
): Promise<Buffer> {
	const doc = createPDFDocument(config);
	const isAr = config.language === "ar";

	registerFooter(doc, { companyName: data.companyName, language: config.language });

	// Header
	renderHeader(doc, {
		title: data.projectName,
		subtitle: data.title,
		companyName: data.companyName,
		language: config.language,
	});

	// Metadata
	renderKeyValuePairs(
		doc,
		[
			[isAr ? "التاريخ:" : "Date:", formatDate(data.updateDate, config.language)],
			[isAr ? "النوع:" : "Type:", getStatusLabel(data.type, config.language)],
		],
		config.language,
	);

	doc.moveDown(0.5);

	// Body content
	renderSectionTitle(doc, isAr ? "المحتوى" : "Content", config.language);

	const pageWidth = doc.page.width - 80; // 40 margin each side
	doc
		.font("Arabic")
		.fontSize(10)
		.fillColor("#111827")
		.text(data.body, 40, doc.y, {
			width: pageWidth,
			align: isAr ? "right" : "left",
			lineGap: 4,
		});

	// Photos
	if (data.photos?.length) {
		doc.moveDown(1);
		renderSectionTitle(doc, isAr ? "الصور" : "Photos", config.language);

		const photoWidth = (pageWidth - 10) / 2; // 2 columns with gap
		const photoHeight = 150;

		for (let i = 0; i < data.photos.length; i++) {
			const photo = data.photos[i];

			// Check page break
			if (doc.y + photoHeight + 20 > doc.page.height - 80) {
				doc.addPage();
			}

			try {
				const response = await fetch(photo.url);
				if (response.ok) {
					const arrayBuffer = await response.arrayBuffer();
					const imageBuffer = Buffer.from(arrayBuffer);

					const col = i % 2;
					const x = 40 + col * (photoWidth + 10);
					const y = col === 0 ? doc.y : doc.y - photoHeight - 20;

					doc.image(imageBuffer, x, y, {
						width: photoWidth,
						height: photoHeight,
						fit: [photoWidth, photoHeight],
					});

					// Caption
					if (photo.caption) {
						doc
							.font("Arabic")
							.fontSize(8)
							.fillColor("#6B7280")
							.text(photo.caption, x, y + photoHeight + 2, {
								width: photoWidth,
								align: "center",
							});
					}

					// Move Y after every 2 photos
					if (col === 1 || i === data.photos.length - 1) {
						doc.y = y + photoHeight + 20;
					}
				}
			} catch {
				// Skip failed photo fetches silently
			}
		}
	}

	return docToBuffer(doc);
}

/**
 * Generate Claim PDF
 */
export async function generateClaimPDF(
	data: ClaimPDFData,
	config: PDFConfig,
): Promise<Buffer> {
	const doc = createPDFDocument(config);
	const isAr = config.language === "ar";

	registerFooter(doc, { companyName: data.companyName, language: config.language });

	// Header
	renderHeader(doc, {
		title: data.projectName,
		subtitle: isAr
			? `مستخلص رقم ${data.claimNumber}`
			: `Claim #${data.claimNumber}`,
		companyName: data.companyName,
		language: config.language,
	});

	// Claim metadata
	renderSectionTitle(
		doc,
		isAr ? "بيانات المستخل��" : "Claim Details",
		config.language,
	);

	renderKeyValuePairs(
		doc,
		[
			[
				isAr ? "رقم المستخلص:" : "Claim No:",
				String(data.claimNumber),
			],
			[
				isAr ? "فترة المستخلص:" : "Claim Period:",
				`${formatDateShort(data.periodStart, config.language)} - ${formatDateShort(data.periodEnd, config.language)}`,
			],
			[
				isAr ? "الحالة:" : "Status:",
				getStatusLabel(data.status, config.language),
			],
		],
		config.language,
	);

	doc.moveDown(0.5);

	// Items table (if any)
	if (data.items?.length) {
		renderSectionTitle(
			doc,
			isAr ? "البنود" : "Items",
			config.language,
		);

		const rows = data.items.map((item) => [
			item.description,
			formatCurrency(item.amount, data.currency, config.language),
		]);

		// Add total row
		rows.push([
			isAr ? "الإجمالي" : "Total",
			formatCurrency(data.amount, data.currency, config.language),
		]);

		renderTable(doc, {
			headers: isAr
				? ["البند", "المبلغ"]
				: ["Item", "Amount"],
			rows,
			columnWidths: [3, 1],
			language: config.language,
			highlightLastRow: true,
		});
	}

	// Financial summary
	renderSectionTitle(
		doc,
		isAr ? "الملخص المالي" : "Financial Summary",
		config.language,
	);

	renderTable(doc, {
		headers: isAr
			? ["البيان", "المبلغ"]
			: ["Description", "Amount"],
		rows: [
			[
				isAr ? "مبلغ المستخلص" : "Claim Amount",
				formatCurrency(data.amount, data.currency, config.language),
			],
		],
		columnWidths: [3, 1],
		language: config.language,
		highlightLastRow: true,
	});

	// Amount in words
	doc.moveDown(0.5);
	const amountInWords = numberToArabicWords(data.amount);
	doc
		.font("Arabic-Bold")
		.fontSize(10)
		.fillColor("#111827")
		.text(
			isAr ? `المبلغ بالحروف: ${amountInWords}` : `Amount in words: ${amountInWords}`,
			40,
			doc.y,
			{
				width: doc.page.width - 80,
				align: isAr ? "right" : "left",
			},
		);

	return docToBuffer(doc);
}

/**
 * Generate Weekly Report PDF
 */
export async function generateWeeklyReportPDF(
	data: WeeklyReportPDFData,
	config: PDFConfig,
): Promise<Buffer> {
	const doc = createPDFDocument(config);
	const isAr = config.language === "ar";

	registerFooter(doc, { companyName: data.companyName, language: config.language });

	// Header
	renderHeader(doc, {
		title: data.projectName,
		subtitle: isAr ? "التقرير الأسبوعي" : "Weekly Report",
		companyName: data.companyName,
		language: config.language,
	});

	// Date range
	const pageWidth = doc.page.width - 80;
	doc
		.font("Arabic")
		.fontSize(10)
		.fillColor("#6B7280")
		.text(
			`${formatDateShort(data.weekStart, config.language)} - ${formatDateShort(data.weekEnd, config.language)}`,
			40,
			doc.y,
			{ width: pageWidth, align: "center" },
		);

	doc.moveDown(0.8);

	// Summary boxes
	renderSummaryBoxes(
		doc,
		[
			{
				label: isAr ? "نسبة الإنجاز" : "Progress",
				value: `${data.progress}%`,
				color: "#ECFDF5",
			},
			{
				label: isAr ? "التحديثات" : "Updates",
				value: String(data.updates.length),
				color: "#EFF6FF",
			},
			{
				label: isAr ? "المشاكل" : "Issues",
				value: String(data.issues.length),
				color: data.issues.length > 0 ? "#FEF2F2" : "#F9FAFB",
			},
		],
		config.language,
	);

	// Progress bar
	renderProgressBar(doc, data.progress);

	// Updates section
	if (data.updates.length > 0) {
		renderSectionTitle(
			doc,
			isAr ? "التحديثات" : "Updates",
			config.language,
		);

		renderTable(doc, {
			headers: isAr
				? ["التاريخ", "النوع", "الع��وان"]
				: ["Date", "Type", "Title"],
			rows: data.updates.map((u) => [
				formatDateShort(u.date, config.language),
				u.type,
				u.title,
			]),
			columnWidths: [1, 1, 3],
			language: config.language,
		});
	}

	// Expenses section
	if (data.expenses.length > 0) {
		renderSectionTitle(
			doc,
			isAr ? "المصاريف" : "Expenses",
			config.language,
		);

		const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
		const rows = data.expenses.map((e) => [
			e.category,
			formatNumber(e.amount),
		]);
		rows.push([
			isAr ? "الإجمالي" : "Total",
			formatNumber(totalExpenses),
		]);

		renderTable(doc, {
			headers: isAr
				? ["الفئة", "المبلغ"]
				: ["Category", "Amount"],
			rows,
			columnWidths: [3, 1],
			language: config.language,
			highlightLastRow: true,
		});
	}

	// Issues section
	if (data.issues.length > 0) {
		renderSectionTitle(
			doc,
			isAr ? "المشاكل" : "Issues",
			config.language,
		);

		renderTable(doc, {
			headers: isAr
				? ["العنوا��", "الحالة"]
				: ["Title", "Status"],
			rows: data.issues.map((i) => [
				i.title,
				getStatusLabel(i.status, config.language),
			]),
			columnWidths: [3, 1],
			language: config.language,
		});
	}

	return docToBuffer(doc);
}

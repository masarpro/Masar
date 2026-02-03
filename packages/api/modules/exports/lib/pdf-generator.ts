// ═══════════════════════════════════════════════════════════════════════════
// PDF Generator (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

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
 * TODO: Implement with actual PDF library (puppeteer, jspdf, etc.)
 */
export async function generateUpdatePDF(
	data: UpdatePDFData,
	config: PDFConfig,
): Promise<Buffer> {
	// Stub implementation - returns HTML as buffer for now
	const html = `
<!DOCTYPE html>
<html dir="${config.language === "ar" ? "rtl" : "ltr"}" lang="${config.language}">
<head>
	<meta charset="UTF-8">
	<title>${config.title}</title>
	<style>
		body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: ${config.language === "ar" ? "rtl" : "ltr"}; }
		.header { text-align: center; margin-bottom: 30px; }
		.logo { max-height: 60px; margin-bottom: 10px; }
		h1 { color: #333; margin: 0; }
		h2 { color: #666; margin: 10px 0 30px; }
		.content { line-height: 1.8; }
		.meta { color: #888; font-size: 0.9em; margin-bottom: 20px; }
		.photos { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
		.photo { max-width: 200px; }
		.footer { margin-top: 40px; text-align: center; color: #888; font-size: 0.8em; }
	</style>
</head>
<body>
	<div class="header">
		${data.companyLogo ? `<img src="${data.companyLogo}" class="logo" alt="${data.companyName}">` : ""}
		<h1>${data.projectName}</h1>
		<h2>${data.title}</h2>
	</div>
	<div class="meta">
		<p>${config.language === "ar" ? "التاريخ" : "Date"}: ${data.updateDate.toLocaleDateString(config.language === "ar" ? "ar-SA" : "en-US")}</p>
		<p>${config.language === "ar" ? "النوع" : "Type"}: ${data.type}</p>
	</div>
	<div class="content">
		${data.body}
	</div>
	${
		data.photos?.length
			? `
	<div class="photos">
		${data.photos.map((p) => `<img src="${p.url}" class="photo" alt="${p.caption || ""}">`).join("")}
	</div>
	`
			: ""
	}
	<div class="footer">
		<p>${data.companyName}</p>
	</div>
</body>
</html>
	`;

	return Buffer.from(html, "utf-8");
}

/**
 * Generate Claim PDF
 * TODO: Implement with actual PDF library
 */
export async function generateClaimPDF(
	data: ClaimPDFData,
	config: PDFConfig,
): Promise<Buffer> {
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat(config.language === "ar" ? "ar-SA" : "en-US", {
			style: "currency",
			currency: data.currency,
		}).format(amount);
	};

	const html = `
<!DOCTYPE html>
<html dir="${config.language === "ar" ? "rtl" : "ltr"}" lang="${config.language}">
<head>
	<meta charset="UTF-8">
	<title>${config.title}</title>
	<style>
		body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: ${config.language === "ar" ? "rtl" : "ltr"}; }
		.header { text-align: center; margin-bottom: 30px; }
		.logo { max-height: 60px; margin-bottom: 10px; }
		h1 { color: #333; margin: 0; }
		h2 { color: #666; margin: 10px 0 30px; }
		table { width: 100%; border-collapse: collapse; margin: 20px 0; }
		th, td { border: 1px solid #ddd; padding: 12px; text-align: ${config.language === "ar" ? "right" : "left"}; }
		th { background: #f5f5f5; }
		.total { font-weight: bold; background: #f0f0f0; }
		.status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 0.9em; }
		.footer { margin-top: 40px; text-align: center; color: #888; font-size: 0.8em; }
	</style>
</head>
<body>
	<div class="header">
		${data.companyLogo ? `<img src="${data.companyLogo}" class="logo" alt="${data.companyName}">` : ""}
		<h1>${data.projectName}</h1>
		<h2>${config.language === "ar" ? "مستخلص رقم" : "Claim #"}${data.claimNumber}</h2>
	</div>
	<table>
		<tr>
			<th>${config.language === "ar" ? "فترة المستخلص" : "Claim Period"}</th>
			<td>${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}</td>
		</tr>
		<tr>
			<th>${config.language === "ar" ? "الحالة" : "Status"}</th>
			<td><span class="status">${data.status}</span></td>
		</tr>
	</table>
	${
		data.items?.length
			? `
	<table>
		<thead>
			<tr>
				<th>${config.language === "ar" ? "البند" : "Item"}</th>
				<th>${config.language === "ar" ? "المبلغ" : "Amount"}</th>
			</tr>
		</thead>
		<tbody>
			${data.items.map((item) => `<tr><td>${item.description}</td><td>${formatCurrency(item.amount)}</td></tr>`).join("")}
		</tbody>
	</table>
	`
			: ""
	}
	<table>
		<tr class="total">
			<th>${config.language === "ar" ? "الإجمالي" : "Total"}</th>
			<td>${formatCurrency(data.amount)}</td>
		</tr>
	</table>
	<div class="footer">
		<p>${data.companyName}</p>
	</div>
</body>
</html>
	`;

	return Buffer.from(html, "utf-8");
}

/**
 * Generate Weekly Report PDF
 * TODO: Implement with actual PDF library
 */
export async function generateWeeklyReportPDF(
	data: WeeklyReportPDFData,
	config: PDFConfig,
): Promise<Buffer> {
	const html = `
<!DOCTYPE html>
<html dir="${config.language === "ar" ? "rtl" : "ltr"}" lang="${config.language}">
<head>
	<meta charset="UTF-8">
	<title>${config.title}</title>
	<style>
		body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: ${config.language === "ar" ? "rtl" : "ltr"}; }
		.header { text-align: center; margin-bottom: 30px; }
		.logo { max-height: 60px; margin-bottom: 10px; }
		h1 { color: #333; margin: 0; }
		h2 { color: #666; margin: 10px 0 30px; }
		h3 { color: #444; margin: 20px 0 10px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
		table { width: 100%; border-collapse: collapse; margin: 10px 0 20px; }
		th, td { border: 1px solid #ddd; padding: 10px; text-align: ${config.language === "ar" ? "right" : "left"}; }
		th { background: #f5f5f5; }
		.progress-bar { background: #e0e0e0; border-radius: 10px; height: 20px; overflow: hidden; }
		.progress-fill { background: #4caf50; height: 100%; transition: width 0.3s; }
		.summary { display: flex; gap: 20px; margin: 20px 0; }
		.summary-item { flex: 1; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px; }
		.summary-value { font-size: 2em; font-weight: bold; color: #333; }
		.summary-label { color: #666; }
		.footer { margin-top: 40px; text-align: center; color: #888; font-size: 0.8em; }
	</style>
</head>
<body>
	<div class="header">
		${data.companyLogo ? `<img src="${data.companyLogo}" class="logo" alt="${data.companyName}">` : ""}
		<h1>${data.projectName}</h1>
		<h2>${config.language === "ar" ? "التقرير الأسبوعي" : "Weekly Report"}</h2>
		<p>${data.weekStart.toLocaleDateString()} - ${data.weekEnd.toLocaleDateString()}</p>
	</div>

	<div class="summary">
		<div class="summary-item">
			<div class="summary-value">${data.progress}%</div>
			<div class="summary-label">${config.language === "ar" ? "نسبة الإنجاز" : "Progress"}</div>
		</div>
		<div class="summary-item">
			<div class="summary-value">${data.updates.length}</div>
			<div class="summary-label">${config.language === "ar" ? "التحديثات" : "Updates"}</div>
		</div>
		<div class="summary-item">
			<div class="summary-value">${data.issues.length}</div>
			<div class="summary-label">${config.language === "ar" ? "المشاكل" : "Issues"}</div>
		</div>
	</div>

	<div class="progress-bar">
		<div class="progress-fill" style="width: ${data.progress}%"></div>
	</div>

	${
		data.updates.length
			? `
	<h3>${config.language === "ar" ? "التحديثات" : "Updates"}</h3>
	<table>
		<thead>
			<tr>
				<th>${config.language === "ar" ? "التاريخ" : "Date"}</th>
				<th>${config.language === "ar" ? "النوع" : "Type"}</th>
				<th>${config.language === "ar" ? "العنوان" : "Title"}</th>
			</tr>
		</thead>
		<tbody>
			${data.updates.map((u) => `<tr><td>${u.date.toLocaleDateString()}</td><td>${u.type}</td><td>${u.title}</td></tr>`).join("")}
		</tbody>
	</table>
	`
			: ""
	}

	${
		data.expenses.length
			? `
	<h3>${config.language === "ar" ? "المصاريف" : "Expenses"}</h3>
	<table>
		<thead>
			<tr>
				<th>${config.language === "ar" ? "الفئة" : "Category"}</th>
				<th>${config.language === "ar" ? "المبلغ" : "Amount"}</th>
			</tr>
		</thead>
		<tbody>
			${data.expenses.map((e) => `<tr><td>${e.category}</td><td>${e.amount}</td></tr>`).join("")}
		</tbody>
	</table>
	`
			: ""
	}

	${
		data.issues.length
			? `
	<h3>${config.language === "ar" ? "المشاكل" : "Issues"}</h3>
	<table>
		<thead>
			<tr>
				<th>${config.language === "ar" ? "العنوان" : "Title"}</th>
				<th>${config.language === "ar" ? "الحالة" : "Status"}</th>
			</tr>
		</thead>
		<tbody>
			${data.issues.map((i) => `<tr><td>${i.title}</td><td>${i.status}</td></tr>`).join("")}
		</tbody>
	</table>
	`
			: ""
	}

	<div class="footer">
		<p>${data.companyName}</p>
	</div>
</body>
</html>
	`;

	return Buffer.from(html, "utf-8");
}

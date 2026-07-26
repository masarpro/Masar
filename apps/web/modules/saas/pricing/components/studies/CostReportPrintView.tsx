import type {
	CostReport,
	CostReportGroup,
	CostReportSection,
} from "../../lib/cost-report";

// ═══════════════════════════════════════════════════════════════
// طباعة / تصدير PDF لتقرير التكلفة والتسعير
// يبني مستند HTML كاملاً ويطبعه عبر iframe مخفي — نفس أسلوب BOQPrintView.
// ═══════════════════════════════════════════════════════════════

interface CostReportPrintProps {
	report: CostReport;
	studyName?: string;
	scopeLabel?: string;
	organizationName?: string;
	organizationLogo?: string;
	organizationAddress?: string;
	organizationPhone?: string;
	organizationEmail?: string;
}

export function printCostReport(props: CostReportPrintProps): void {
	const html = buildHTML(props);

	const iframe = document.createElement("iframe");
	iframe.style.position = "fixed";
	iframe.style.top = "-10000px";
	iframe.style.left = "-10000px";
	iframe.style.width = "0";
	iframe.style.height = "0";
	iframe.style.border = "none";
	document.body.appendChild(iframe);

	const doc = iframe.contentDocument || iframe.contentWindow?.document;
	if (!doc) {
		document.body.removeChild(iframe);
		return;
	}
	doc.open();
	doc.write(html);
	doc.close();

	iframe.onload = () => {
		setTimeout(() => {
			iframe.contentWindow?.print();
			setTimeout(() => {
				document.body.removeChild(iframe);
			}, 1000);
		}, 500);
	};
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fmt(value: number, decimals = 2): string {
	if (!Number.isFinite(value)) return "0";
	return value.toLocaleString("en-US", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

function esc(str: string | undefined | null): string {
	if (!str) return "";
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────
// Tables
// ─────────────────────────────────────────────────────────────

function materialGroupHTML(group: CostReportGroup, showTitle: boolean): string {
	const qtyDecimals = group.unit === "طن" ? 3 : 2;
	let html = "";
	if (showTitle) {
		html += `<div class="sub-title">${esc(group.label)}</div>`;
	}
	html += `<table>
    <thead><tr>
      <th>البند</th><th>الدور</th><th>الكمية</th>
      <th>الوحدة</th><th>متوسط السعر</th><th>الإجمالي (ر.س)</th>
    </tr></thead>
    <tbody>`;
	for (const row of group.rows) {
		html += `<tr>
      <td>${esc(row.label)}</td>
      <td>${esc(row.detail) || "—"}</td>
      <td class="number">${fmt(row.quantity, qtyDecimals)}</td>
      <td>${esc(row.unit)}</td>
      <td class="number">${row.unitPrice > 0 ? fmt(row.unitPrice) : "—"}</td>
      <td class="number">${row.total > 0 ? fmt(row.total) : "—"}</td>
    </tr>`;
	}
	html += `<tr class="totals-row">
    <td colspan="2">إجمالي ${esc(group.label)}</td>
    <td class="number">${fmt(group.totalQuantity, qtyDecimals)}</td>
    <td>${esc(group.unit)}</td>
    <td>—</td>
    <td class="number">${fmt(group.total)}</td>
  </tr>`;
	html += `</tbody></table>`;
	return html;
}

function detailGroupHTML(group: CostReportGroup, showTitle: boolean): string {
	let html = "";
	if (showTitle) {
		html += `<div class="sub-title">${esc(group.label)}</div>`;
	}
	html += `<table>
    <thead><tr>
      <th>البند</th><th>التفاصيل</th><th>الكمية</th>
      <th>الوحدة</th><th>السعر</th><th>الإجمالي (ر.س)</th>
    </tr></thead>
    <tbody>`;
	for (const row of group.rows) {
		html += `<tr>
      <td>${esc(row.label)}</td>
      <td>${esc(row.detail) || "—"}</td>
      <td class="number">${fmt(row.quantity)}</td>
      <td>${esc(row.unit)}</td>
      <td class="number">${row.unitPrice > 0 ? fmt(row.unitPrice) : "—"}</td>
      <td class="number">${fmt(row.total)}</td>
    </tr>`;
	}
	html += `<tr class="totals-row">
    <td colspan="5">إجمالي ${esc(group.label)}</td>
    <td class="number">${fmt(group.total)}</td>
  </tr>`;
	html += `</tbody></table>`;
	return html;
}

function sectionHTML(
	section: CostReportSection,
	renderer: (g: CostReportGroup, showTitle: boolean) => string,
): string {
	if (section.groups.length === 0 && section.total <= 0) return "";

	let html = `<div class="section">`;
	html += `<div class="section-title">
    <span>${esc(section.icon)} ${esc(section.label)}</span>
    <span class="section-amount">${fmt(section.total)} ر.س</span>
  </div>`;

	if (section.groups.length === 0) {
		html += `<p class="note">لا توجد تفاصيل محفوظة — الإجمالي أعلاه من ملخص التكلفة.</p>`;
	} else {
		for (const group of section.groups) {
			html += renderer(group, section.groups.length > 1);
		}
	}
	html += `</div>`;
	return html;
}

// ─────────────────────────────────────────────────────────────
// Document
// ─────────────────────────────────────────────────────────────

function buildHTML(props: CostReportPrintProps): string {
	const {
		report,
		studyName,
		scopeLabel,
		organizationName,
		organizationLogo,
		organizationAddress,
		organizationPhone,
		organizationEmail,
	} = props;

	const today = new Date().toLocaleDateString("ar-SA", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	let body = "";

	// المواد
	for (const section of report.materialSections) {
		body += sectionHTML(section, materialGroupHTML);
	}

	if (report.materialSections.length > 0) {
		body += `<div class="grand-strip">
      <span>إجمالي المواد</span>
      <span class="number">${fmt(report.materialTotalComputed)} ر.س</span>
    </div>`;
	}

	// الأسعار المعتمدة
	if (report.unitPriceRows.length > 0) {
		body += `<div class="section">
      <div class="section-title"><span>🏷️ أسعار الوحدات المعتمدة</span></div>
      <table>
        <thead><tr><th>المادة</th><th>الوحدة</th><th>السعر (ر.س)</th></tr></thead>
        <tbody>`;
		for (const row of report.unitPriceRows) {
			body += `<tr>
        <td>${esc(row.label)}</td>
        <td>${esc(row.unit)}</td>
        <td class="number">${fmt(row.unitPrice)}</td>
      </tr>`;
		}
		body += `</tbody></table></div>`;
	}

	// المصنعيات / التشوين / غير المباشرة
	body += sectionHTML(report.laborSection, detailGroupHTML);
	body += sectionHTML(report.storageSection, detailGroupHTML);
	body += sectionHTML(report.indirectSection, detailGroupHTML);

	// الملخص النهائي
	body += `<div class="section avoid-break">
    <div class="section-title"><span>📊 ملخص التكلفة النهائي</span></div>
    <table>
      <thead><tr><th>البند</th><th>الإجمالي (ر.س)</th><th>النسبة</th></tr></thead>
      <tbody>`;
	for (const row of report.summaryRows) {
		body += `<tr>
      <td>${esc(row.label)}</td>
      <td class="number">${fmt(row.total)}</td>
      <td class="number">${fmt(row.percent, 1)}%</td>
    </tr>`;
	}
	body += `<tr class="totals-row">
      <td>إجمالي التكلفة</td>
      <td class="number">${fmt(report.grandTotal)}</td>
      <td class="number">100%</td>
    </tr>`;
	body += `</tbody></table></div>`;

	// التسعير والأرباح
	const p = report.pricing;
	if (p) {
		body += `<div class="section avoid-break">
      <div class="section-title"><span>💰 التسعير والأرباح</span></div>
      <table>
        <tbody>
          <tr><td>إجمالي التكلفة</td><td class="number">${fmt(p.totalCost)}</td></tr>
          ${p.overheadAmount > 0 ? `<tr><td>المصاريف الإدارية</td><td class="number">${fmt(p.overheadAmount)}</td></tr>` : ""}
          ${p.profitAmount !== 0 ? `<tr><td>هامش الربح</td><td class="number">${fmt(p.profitAmount)}</td></tr>` : ""}
          ${p.contingencyAmount > 0 ? `<tr><td>احتياطي الطوارئ</td><td class="number">${fmt(p.contingencyAmount)}</td></tr>` : ""}
          <tr><td><strong>سعر البيع قبل الضريبة</strong></td><td class="number"><strong>${fmt(p.sellingPriceBeforeVat)}</strong></td></tr>
          ${p.vatAmount > 0 ? `<tr><td>ضريبة القيمة المضافة</td><td class="number">${fmt(p.vatAmount)}</td></tr>` : ""}
          <tr class="totals-row"><td>الإجمالي شامل الضريبة</td><td class="number">${fmt(p.grandTotal)}</td></tr>
        </tbody>
      </table>`;

		if (p.buildingArea > 0) {
			body += `<table class="metrics">
        <thead><tr><th>مساحة البناء</th><th>تكلفة المتر المربع</th><th>سعر بيع المتر المربع</th><th>نسبة الربح</th></tr></thead>
        <tbody><tr>
          <td class="number">${fmt(p.buildingArea)} م²</td>
          <td class="number">${fmt(p.costPerSqm)} ر.س/م²</td>
          <td class="number">${fmt(p.pricePerSqm)} ر.س/م²</td>
          <td class="number">${fmt(p.profitPercent, 1)}%</td>
        </tr></tbody>
      </table>`;
		}
		body += `</div>`;
	}

	return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير التكلفة والتسعير — ${esc(studyName)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl; color: #1f2937; font-size: 12px; line-height: 1.5;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .header {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 12px; border-bottom: 2px solid #2563eb; margin-bottom: 16px;
    }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .header-logo { width: 60px; height: 60px; object-fit: contain; }
    .header-company { font-size: 22px; font-weight: 700; color: #1e3a5f; }
    .header-sub { font-size: 11px; color: #6b7280; }
    .header-left { text-align: left; font-size: 10px; color: #6b7280; }

    .report-title { text-align: center; margin-bottom: 16px; }
    .report-title h1 { font-size: 20px; font-weight: 700; color: #1e40af; margin-bottom: 4px; }
    .report-title .meta { font-size: 11px; color: #6b7280; }

    .section { margin-bottom: 16px; }
    .avoid-break { break-inside: avoid; }
    .section-title {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 13px; font-weight: 700; color: #1e3a5f;
      padding: 6px 10px; background: #f0f4ff; border-radius: 4px; margin-bottom: 6px;
    }
    .section-amount { font-variant-numeric: tabular-nums; direction: ltr; }
    .sub-title { font-size: 12px; font-weight: 600; color: #4b5563; margin: 8px 0 4px; }
    .note { font-size: 11px; color: #6b7280; padding: 4px 10px; }

    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
    thead { display: table-header-group; }
    th {
      background: #f1f5f9; color: #374151; font-weight: 600;
      padding: 7px 8px; text-align: right; border: 1px solid #d1d5db;
    }
    td { padding: 6px 8px; text-align: right; border: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #fafbfc; }
    .totals-row td {
      font-weight: 700; background: #eff6ff !important; border-top: 2px solid #9ca3af;
    }
    .number { font-variant-numeric: tabular-nums; direction: ltr; text-align: left; }

    .grand-strip {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 13px; font-weight: 700; color: #1e40af;
      padding: 8px 10px; background: #eff6ff; border: 1px solid #bfdbfe;
      border-radius: 4px; margin-bottom: 16px;
    }
    .metrics th { background: #f8fafc; }

    .footer {
      margin-top: 20px; padding-top: 8px; border-top: 1px solid #e5e7eb;
      text-align: center; font-size: 10px; color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-right">
      ${organizationLogo ? `<img class="header-logo" src="${esc(organizationLogo)}" alt="" />` : ""}
      <div>
        <div class="header-company">${esc(organizationName)}</div>
        ${organizationAddress ? `<div class="header-sub">${esc(organizationAddress)}</div>` : ""}
      </div>
    </div>
    <div class="header-left">
      ${organizationPhone ? `<div>${esc(organizationPhone)}</div>` : ""}
      ${organizationEmail ? `<div>${esc(organizationEmail)}</div>` : ""}
    </div>
  </div>

  <div class="report-title">
    <h1>تقرير التكلفة والتسعير</h1>
    <div class="meta">
      الدراسة: ${esc(studyName) || "—"}
      &nbsp;|&nbsp; التاريخ: ${today}
      ${scopeLabel ? `&nbsp;|&nbsp; النطاق: ${esc(scopeLabel)}` : ""}
    </div>
  </div>

  ${body}

  <div class="footer">
    تم إنشاء هذا التقرير عبر منصة مسار لإدارة المشاريع الإنشائية
  </div>
</body>
</html>`;
}

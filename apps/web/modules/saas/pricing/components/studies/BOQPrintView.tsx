import type { BOQSummary, FactoryOrderEntry } from "../../lib/boq-aggregator";
import type { CuttingDetailRow } from "../../lib/boq-recalculator";

interface BOQPrintViewProps {
	activeTab: "summary" | "factory" | "cutting";
	summary: BOQSummary;
	studyName?: string;
	floorLabel?: string;
	organizationName?: string;
	organizationLogo?: string;
	organizationAddress?: string;
	organizationPhone?: string;
	organizationEmail?: string;
}

/**
 * Builds a full HTML document and prints it via a hidden iframe.
 * No JSX rendered — this is a plain function, not a component.
 */
export function printBOQ(props: BOQPrintViewProps): void {
	const html = buildPrintHTML(props);

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
// Number formatting (mirrors the app's formatNumber)
// ─────────────────────────────────────────────────────────────

function fmt(value: number, decimals = 2): string {
	if (isNaN(value)) return "0";
	return value.toLocaleString("en-US", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

// ─────────────────────────────────────────────────────────────
// Escape HTML
// ─────────────────────────────────────────────────────────────

function esc(str: string | undefined | null): string {
	if (!str) return "";
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────
// Build full HTML document
// ─────────────────────────────────────────────────────────────

function buildPrintHTML(props: BOQPrintViewProps): string {
	const {
		activeTab,
		summary,
		studyName,
		floorLabel,
		organizationName,
		organizationLogo,
		organizationAddress,
		organizationPhone,
		organizationEmail,
	} = props;

	const tabTitles: Record<string, string> = {
		summary: "ملخص الكميات",
		factory: "طلبية المصنع — حديد التسليح",
		cutting: "تفاصيل التفصيل",
	};
	const tabTitle = tabTitles[activeTab];
	const today = new Date().toLocaleDateString("ar-SA", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const tableHTML =
		activeTab === "summary"
			? buildSummaryHTML(summary)
			: activeTab === "factory"
				? buildFactoryHTML(summary.factoryOrder)
				: buildCuttingHTML(summary.allCuttingDetails);

	return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${esc(tabTitle)} — ${esc(studyName)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 15mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      color: #1f2937;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #2563eb;
      margin-bottom: 16px;
    }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .header-logo { width: 60px; height: 60px; object-fit: contain; }
    .header-company { font-size: 22px; font-weight: 700; color: #1e3a5f; }
    .header-sub { font-size: 11px; color: #6b7280; }
    .header-left { text-align: left; font-size: 10px; color: #6b7280; }

    /* Report title */
    .report-title {
      text-align: center;
      margin-bottom: 16px;
    }
    .report-title h1 { font-size: 20px; font-weight: 700; color: #1e40af; margin-bottom: 4px; }
    .report-title .meta { font-size: 11px; color: #6b7280; }

    /* Tables */
    .section { margin-bottom: 16px; break-inside: avoid; }
    .section-title {
      font-size: 13px; font-weight: 700; color: #1e3a5f;
      padding: 6px 10px; background: #f0f4ff; border-radius: 4px;
      margin-bottom: 6px;
    }
    .sub-title {
      font-size: 12px; font-weight: 600; color: #4b5563;
      margin-bottom: 4px;
    }
    table {
      width: 100%; border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background: #f1f5f9; color: #374151; font-weight: 600;
      padding: 8px 10px; text-align: right;
      border: 1px solid #d1d5db;
    }
    td {
      padding: 7px 10px; text-align: right;
      border: 1px solid #e5e7eb;
    }
    tr:nth-child(even) td { background: #fafbfc; }
    .totals-row td {
      font-weight: 700;
      background: #eff6ff !important;
      border-top: 2px solid #9ca3af;
    }
    .section-totals {
      text-align: left; font-size: 11px; font-weight: 700;
      margin-top: 4px; color: #4b5563;
    }
    .number {
      font-variant-numeric: tabular-nums;
      direction: ltr;
      text-align: left;
    }
    .waste-low { color: #16a34a; }
    .waste-mid { color: #d97706; }
    .waste-high { color: #dc2626; font-weight: 600; }

    /* Footer */
    .footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="header-right">
      ${/* NOTE: <img> used intentionally — print/template context where next/Image optimization doesn't apply */ ""}
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

  <!-- Report Title -->
  <div class="report-title">
    <h1>تقرير الكميات — ${esc(tabTitle)}</h1>
    <div class="meta">
      الدراسة: ${esc(studyName) || "—"}
      &nbsp;|&nbsp; التاريخ: ${today}
      ${floorLabel ? `&nbsp;|&nbsp; الدور: ${esc(floorLabel)}` : ""}
    </div>
  </div>

  <!-- Content -->
  ${tableHTML}

  <!-- Footer -->
  <div class="footer">
    تم إعداد هذا التقرير بواسطة منصة مسار — app-masar.com
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// Summary HTML
// ─────────────────────────────────────────────────────────────

function buildSummaryHTML(summary: BOQSummary): string {
	let html = "";

	for (const section of summary.sections) {
		html += `<div class="section">`;
		html += `<div class="section-title">${esc(section.icon)} ${esc(section.label)}</div>`;

		for (const group of section.subGroups) {
			if (section.subGroups.length > 1) {
				html += `<div class="sub-title">${esc(group.label)}</div>`;
			}

			const hasBlocks = section.category === "blocks";

			html += `<table>
        <thead><tr>
          <th>العنصر</th>
          <th>الكمية</th>
          <th>خرسانة (م³)</th>
          <th>حديد (كجم)</th>
          ${hasBlocks ? "<th>بلوك</th>" : ""}
        </tr></thead>
        <tbody>`;

			for (const detail of group.items) {
				html += `<tr>
          <td>${esc(detail.item.name)}</td>
          <td>${detail.item.quantity}</td>
          <td class="number">${fmt(detail.item.concreteVolume)}</td>
          <td class="number">${fmt(detail.item.steelWeight)}</td>
          ${hasBlocks ? `<td class="number">${fmt(detail.item.quantity)}</td>` : ""}
        </tr>`;
			}

			html += `</tbody></table>`;

			// Section subtotals
			const parts: string[] = [];
			if (section.totalConcrete > 0)
				parts.push(`خرسانة ${fmt(section.totalConcrete)} م³`);
			if (section.totalRebar > 0)
				parts.push(`حديد ${fmt(section.totalRebar)} كجم`);
			if (section.totalBlocks > 0)
				parts.push(`بلوك ${fmt(section.totalBlocks)}`);
			if (parts.length > 0) {
				html += `<div class="section-totals">إجمالي القسم: ${parts.join(" | ")}</div>`;
			}
		}

		html += `</div>`;
	}

	// Grand totals
	html += `<div class="section" style="border-top: 2px solid #9ca3af; padding-top: 12px;">`;
	html += `<div class="section-title">الإجمالي العام</div>`;
	html += `<table>
    <thead><tr>
      <th>المادة</th>
      <th>الكمية</th>
      <th>الوحدة</th>
    </tr></thead>
    <tbody>`;

	if (summary.grandTotals.concrete > 0) {
		html += `<tr>
      <td style="font-weight:700">الخرسانة</td>
      <td class="number">${fmt(summary.grandTotals.concrete)}</td>
      <td>م³</td>
    </tr>`;
	}
	if (summary.grandTotals.rebar > 0) {
		html += `<tr>
      <td style="font-weight:700">حديد التسليح</td>
      <td class="number">${fmt(summary.grandTotals.rebar)}</td>
      <td>كجم (${fmt(summary.grandTotals.rebar / 1000, 2)} طن)</td>
    </tr>`;
	}
	if (summary.grandTotals.blocks > 0) {
		html += `<tr>
      <td style="font-weight:700">البلوك</td>
      <td class="number">${fmt(summary.grandTotals.blocks)}</td>
      <td>بلوكة</td>
    </tr>`;
	}
	if (summary.grandTotals.formwork > 0) {
		html += `<tr>
      <td style="font-weight:700">الطوبار</td>
      <td class="number">${fmt(summary.grandTotals.formwork)}</td>
      <td>م²</td>
    </tr>`;
	}

	html += `</tbody></table></div>`;

	return html;
}

// ─────────────────────────────────────────────────────────────
// Factory Order HTML
// ─────────────────────────────────────────────────────────────

function buildFactoryHTML(factoryOrder: FactoryOrderEntry[]): string {
	const totalBars = factoryOrder.reduce((s, e) => s + e.count, 0);
	const totalWeight = factoryOrder.reduce((s, e) => s + e.weight, 0);

	let html = `<div class="section">
    <table>
      <thead><tr>
        <th>القطر (مم)</th>
        <th>طول السيخ (م)</th>
        <th>عدد الأسياخ</th>
        <th>الوزن (كجم)</th>
        <th>الوزن (طن)</th>
      </tr></thead>
      <tbody>`;

	for (const entry of factoryOrder) {
		html += `<tr>
      <td>Ø${entry.diameter}</td>
      <td>${entry.stockLength}</td>
      <td>${entry.count}</td>
      <td class="number">${fmt(entry.weight)}</td>
      <td class="number">${fmt(entry.weight / 1000, 3)}</td>
    </tr>`;
	}

	html += `<tr class="totals-row">
      <td>الإجمالي</td>
      <td></td>
      <td>${totalBars}</td>
      <td class="number">${fmt(totalWeight)}</td>
      <td class="number">${fmt(totalWeight / 1000, 3)} طن</td>
    </tr>`;

	html += `</tbody></table></div>`;
	return html;
}

// ─────────────────────────────────────────────────────────────
// Cutting Details HTML
// ─────────────────────────────────────────────────────────────

function buildCuttingHTML(cuttingDetails: CuttingDetailRow[]): string {
	const diameterGroups = new Map<number, CuttingDetailRow[]>();
	for (const d of cuttingDetails) {
		const list = diameterGroups.get(d.diameter) || [];
		list.push(d);
		diameterGroups.set(d.diameter, list);
	}

	const sortedDiameters = Array.from(diameterGroups.keys()).sort(
		(a, b) => a - b,
	);

	let html = "";

	for (const diameter of sortedDiameters) {
		const group = diameterGroups.get(diameter)!;
		const groupWeight = group.reduce((s, d) => s + d.grossWeight, 0);
		const groupStocks = group.reduce((s, d) => s + d.stocksNeeded, 0);

		html += `<div class="section">`;
		html += `<div class="section-title">Ø${diameter} مم — ${group.length} عملية قص — ${groupStocks} سيخ مصنع — ${fmt(groupWeight)} كجم</div>`;
		html += `<table>
      <thead><tr>
        <th>العنصر</th>
        <th>الوصف</th>
        <th>طول القطعة (م)</th>
        <th>العدد</th>
        <th>أسياخ المصنع</th>
        <th>الهالك %</th>
        <th>الوزن (كجم)</th>
      </tr></thead>
      <tbody>`;

		for (const d of group) {
			const wasteClass =
				d.wastePercentage > 15
					? "waste-high"
					: d.wastePercentage > 8
						? "waste-mid"
						: "waste-low";

			html += `<tr>
        <td>${esc(d.element)}</td>
        <td>${esc(d.description)}</td>
        <td>${d.barLength}</td>
        <td>${d.barCount}</td>
        <td>${d.stocksNeeded}</td>
        <td class="${wasteClass}">${d.wastePercentage}%</td>
        <td class="number">${fmt(d.grossWeight)}</td>
      </tr>`;
		}

		html += `</tbody></table></div>`;
	}

	return html;
}

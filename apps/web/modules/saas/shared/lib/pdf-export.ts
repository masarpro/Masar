"use client";

/**
 * Collect all CSS from the current page's stylesheets.
 */
function collectCSS(): string {
	const rules: string[] = [];
	for (const sheet of Array.from(document.styleSheets)) {
		try {
			for (const rule of Array.from(sheet.cssRules)) {
				rules.push(rule.cssText);
			}
		} catch {
			// cross-origin stylesheet — skip
		}
	}
	return `<style>${rules.join("\n")}</style>`;
}

/**
 * Build the document HTML from a container, using the table trick
 * for repeating header/footer if data-pdf-* attributes are present.
 */
function buildDocumentHTML(container: HTMLElement): string {
	const css = collectCSS();
	const headerEl = container.querySelector("[data-pdf-header]");
	const bodyEl = container.querySelector("[data-pdf-body]");
	const footerEl = container.querySelector("[data-pdf-footer]");

	if (headerEl && bodyEl && footerEl) {
		return `${css}
			<table class="print-table">
				<thead><tr><td class="print-cell">${headerEl.innerHTML}</td></tr></thead>
				<tfoot><tr><td class="print-cell">${footerEl.innerHTML}</td></tr></tfoot>
				<tbody><tr><td class="print-cell">${bodyEl.innerHTML}</td></tr></tbody>
			</table>`;
	}

	return `${css}${container.outerHTML}`;
}

/**
 * Export a document to PDF via server-side Puppeteer.
 * Downloads the file directly with the specified filename.
 */
export async function exportToPDF(
	containerId: string,
	filename: string,
): Promise<void> {
	const container = document.getElementById(containerId);
	if (!container) {
		throw new Error(`Element #${containerId} not found`);
	}

	const html = buildDocumentHTML(container);

	const response = await fetch("/api/pdf/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ html, filename }),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(
			(err as { error?: string }).error || "PDF generation failed",
		);
	}

	// Download the blob
	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Print a document using a clean browser window with the table trick
 * for repeating header/footer on every page.
 */
export function printDocument(containerId: string): void {
	const container = document.getElementById(containerId);
	if (!container) return;

	const headerEl = container.querySelector("[data-pdf-header]");
	const bodyEl = container.querySelector("[data-pdf-body]");
	const footerEl = container.querySelector("[data-pdf-footer]");

	const styleSheets = Array.from(
		document.querySelectorAll('link[rel="stylesheet"], style'),
	)
		.map((el) => el.outerHTML)
		.join("\n");

	const dir =
		container.closest("[dir]")?.getAttribute("dir") ||
		document.documentElement.dir ||
		"rtl";

	let documentHTML: string;
	if (headerEl && bodyEl && footerEl) {
		documentHTML = `
			<table class="print-table">
				<thead><tr><td class="print-cell">${headerEl.innerHTML}</td></tr></thead>
				<tfoot><tr><td class="print-cell">${footerEl.innerHTML}</td></tr></tfoot>
				<tbody><tr><td class="print-cell">${bodyEl.innerHTML}</td></tr></tbody>
			</table>`;
	} else {
		documentHTML = container.innerHTML;
	}

	const printWindow = window.open("", "_blank");
	if (!printWindow) {
		window.print();
		return;
	}

	printWindow.document.write(`<!DOCTYPE html>
<html dir="${dir}" lang="ar">
<head>
<meta charset="utf-8" />
<title>طباعة</title>
${styleSheets}
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    direction: ${dir}; background: white;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @page { size: A4; margin: 0; }
  .print-table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
  .print-table thead { display: table-header-group; }
  .print-table tfoot { display: table-footer-group; }
  .print-table tbody { display: table-row-group; }
  .print-cell { padding: 0; border: none; vertical-align: top; }
  tr { page-break-inside: avoid; }
  h3, h4, h5, h6 { page-break-after: avoid; }
  .no-print, .print\\:hidden, [data-print-hidden="true"] { display: none !important; }
  img { max-width: 100%; }
</style>
</head>
<body>${documentHTML}</body>
</html>`);

	printWindow.document.close();

	const images = printWindow.document.querySelectorAll("img");
	const loadPromises = Array.from(images).map(
		(img) =>
			new Promise<void>((resolve) => {
				if (img.complete) resolve();
				else {
					img.onload = () => resolve();
					img.onerror = () => resolve();
				}
			}),
	);

	Promise.all(loadPromises).then(() => {
		setTimeout(() => {
			printWindow.focus();
			printWindow.print();
		}, 800);
	});
}

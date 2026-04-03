"use client";

/**
 * Open a clean print window with the document content.
 * Uses the browser's native rendering — guarantees perfect Arabic/RTL support.
 *
 * If the container has [data-pdf-header], [data-pdf-body], [data-pdf-footer],
 * uses the HTML <table> trick so the browser repeats header/footer on every page.
 *
 * The user can choose "Save as PDF" in the print dialog to download a PDF.
 */
export function exportToPDF(containerId: string): void {
	const container = document.getElementById(containerId);
	if (!container) {
		console.error(`Element #${containerId} not found`);
		return;
	}

	// Collect all stylesheets from the current page
	const stylesheets = Array.from(
		document.querySelectorAll('link[rel="stylesheet"], style'),
	)
		.map((el) => el.outerHTML)
		.join("\n");

	// Detect direction
	const dir =
		container.closest("[dir]")?.getAttribute("dir") ||
		document.documentElement.dir ||
		"rtl";

	// Build document HTML
	const headerEl = container.querySelector("[data-pdf-header]");
	const bodyEl = container.querySelector("[data-pdf-body]");
	const footerEl = container.querySelector("[data-pdf-footer]");

	let documentHTML: string;

	if (headerEl && bodyEl && footerEl) {
		// Table trick: browser auto-repeats <thead>/<tfoot> on every printed page
		documentHTML = `
			<table class="print-table">
				<thead><tr><td class="print-cell">${headerEl.innerHTML}</td></tr></thead>
				<tfoot><tr><td class="print-cell">${footerEl.innerHTML}</td></tr></tfoot>
				<tbody><tr><td class="print-cell">${bodyEl.innerHTML}</td></tr></tbody>
			</table>
		`;
	} else {
		documentHTML = container.innerHTML;
	}

	// Open a clean window
	const printWindow = window.open("", "_blank");
	if (!printWindow) {
		// Popup blocked — fallback to printing the current page
		window.print();
		return;
	}

	printWindow.document.write(`<!DOCTYPE html>
<html dir="${dir}" lang="ar">
<head>
<meta charset="utf-8" />
<title>طباعة</title>
${stylesheets}
<style>
  *, *::before, *::after { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    direction: ${dir};
    background: white;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    size: A4;
    margin: 0;
  }

  /* Table trick for repeating header/footer */
  .print-table {
    width: 100%;
    border-collapse: collapse;
    page-break-inside: auto;
  }
  .print-table thead { display: table-header-group; }
  .print-table tfoot { display: table-footer-group; }
  .print-table tbody { display: table-row-group; }
  .print-cell {
    padding: 0;
    border: none;
    vertical-align: top;
  }

  /* Prevent awkward breaks */
  tr { page-break-inside: avoid; }
  h3, h4, h5, h6 { page-break-after: avoid; }

  /* Hide non-printable elements */
  .no-print, .print\\:hidden, [data-print-hidden="true"] {
    display: none !important;
  }

  img { max-width: 100%; }
</style>
</head>
<body>
${documentHTML}
</body>
</html>`);

	printWindow.document.close();

	// Wait for images to load, then trigger print
	const images = printWindow.document.querySelectorAll("img");
	const imagePromises = Array.from(images).map(
		(img) =>
			new Promise<void>((resolve) => {
				if (img.complete) resolve();
				else {
					img.onload = () => resolve();
					img.onerror = () => resolve();
				}
			}),
	);

	Promise.all(imagePromises).then(() => {
		setTimeout(() => {
			printWindow.focus();
			printWindow.print();
		}, 800);
	});
}

/**
 * Alias — same behavior. Both print and PDF use the browser's print dialog.
 */
export function printDocument(containerId: string): void {
	exportToPDF(containerId);
}

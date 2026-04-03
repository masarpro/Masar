"use client";

/**
 * Print a document with repeating header/footer on every page.
 *
 * Uses the HTML <table> trick: browsers auto-repeat <thead> and <tfoot>
 * on every printed page. The container must have children with
 * [data-pdf-header], [data-pdf-body], and [data-pdf-footer] attributes.
 *
 * Falls back to window.print() if the attributes are not found.
 */
export function printWithRepeatingHeaderFooter(containerId: string): void {
	const container = document.getElementById(containerId);
	if (!container) {
		window.print();
		return;
	}

	const headerEl = container.querySelector("[data-pdf-header]");
	const bodyEl = container.querySelector("[data-pdf-body]");
	const footerEl = container.querySelector("[data-pdf-footer]");

	if (!headerEl || !bodyEl) {
		window.print();
		return;
	}

	// Collect all stylesheets from the parent document
	const styleSheets = Array.from(
		document.querySelectorAll('link[rel="stylesheet"], style'),
	)
		.map((el) => el.outerHTML)
		.join("\n");

	// Detect direction from the container or its closest RTL parent
	const dir = container.closest("[dir]")?.getAttribute("dir") || "rtl";

	const iframe = document.createElement("iframe");
	iframe.style.position = "fixed";
	iframe.style.top = "-9999px";
	iframe.style.left = "-9999px";
	iframe.style.width = "210mm";
	iframe.style.height = "297mm";
	document.body.appendChild(iframe);

	const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
	if (!iframeDoc) {
		window.print();
		document.body.removeChild(iframe);
		return;
	}

	const footerHTML = footerEl ? footerEl.outerHTML : "";

	iframeDoc.open();
	iframeDoc.write(`<!DOCTYPE html>
<html dir="${dir}" lang="ar">
<head>
<meta charset="utf-8" />
${styleSheets}
<style>
  @page {
    size: A4;
    margin: 0;
  }
  html, body {
    margin: 0;
    padding: 0;
    direction: ${dir};
    background: white;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  table.pdf-print-table {
    width: 100%;
    border-collapse: collapse;
  }
  table.pdf-print-table thead {
    display: table-header-group;
  }
  table.pdf-print-table tfoot {
    display: table-footer-group;
  }
  table.pdf-print-table thead td,
  table.pdf-print-table tfoot td,
  table.pdf-print-table tbody td {
    padding: 0;
    border: none;
    vertical-align: top;
  }
  /* Ensure RTL on all pdf sections */
  [data-pdf-header], [data-pdf-body], [data-pdf-footer] {
    direction: rtl;
  }
  /* Hide any no-print elements */
  .no-print, .print\\:hidden, [data-print-hidden="true"] {
    display: none !important;
  }
</style>
</head>
<body>
<table class="pdf-print-table">
  <thead><tr><td>${headerEl.outerHTML}</td></tr></thead>
  ${footerHTML ? `<tfoot><tr><td>${footerHTML}</td></tr></tfoot>` : ""}
  <tbody><tr><td>${bodyEl.outerHTML}</td></tr></tbody>
</table>
</body>
</html>`);
	iframeDoc.close();

	// Wait for styles and images to load, then print
	const iframeWindow = iframe.contentWindow;
	if (!iframeWindow) {
		window.print();
		document.body.removeChild(iframe);
		return;
	}

	const doPrint = () => {
		setTimeout(() => {
			iframeWindow.focus();
			iframeWindow.print();
			// Cleanup after print dialog closes
			setTimeout(() => {
				if (iframe.parentNode) {
					document.body.removeChild(iframe);
				}
			}, 1000);
		}, 600);
	};

	// Use onload if available, otherwise setTimeout fallback
	if (iframe.contentDocument?.readyState === "complete") {
		doPrint();
	} else {
		iframe.onload = doPrint;
	}
}

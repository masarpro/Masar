"use client";

/**
 * Export the current page to PDF via server-side Puppeteer.
 * Sends the page URL to the server — Puppeteer opens it with full CSS/fonts/images.
 */
export async function exportToPDF(
	filename: string,
	customUrl?: string,
): Promise<void> {
	const url = customUrl || window.location.pathname;

	const response = await fetch("/api/pdf/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ url, filename }),
		credentials: "include",
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(
			(err as { error?: string }).error || "PDF generation failed",
		);
	}

	const blob = await response.blob();
	const blobUrl = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = blobUrl;
	a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(blobUrl);
}

/**
 * Print the current page directly.
 * Uses window.print() — the existing @media print CSS handles hiding the app shell.
 */
export function printDocument(): void {
	window.print();
}

// Browser print parity with Puppeteer PDF:
// 1. Set data-printing="browser" (matches body[data-printing] rules in globals.css).
// 2. Move #quotation-print-area / #invoice-print-area to be a direct child of
//    <body> before printing — this is what /api/pdf/generate does for Puppeteer.
//    Without this, the print-area stays nested inside Next.js layout wrappers
//    (main, aside containers) whose padding/margins leak into printed output and
//    cause the browser Ctrl+P result to look different from the PDF.
// 3. Restore the element to its original DOM position after printing so React
//    reconciliation isn't confused.
if (typeof window !== "undefined") {
	let movedElement: HTMLElement | null = null;
	let originalParent: Node | null = null;
	let originalNextSibling: Node | null = null;

	window.addEventListener("beforeprint", () => {
		document.body.setAttribute("data-printing", "browser");

		const printArea =
			document.getElementById("invoice-print-area") ||
			document.getElementById("quotation-print-area");

		if (
			printArea &&
			printArea.parentNode &&
			printArea.parentNode !== document.body
		) {
			originalParent = printArea.parentNode;
			originalNextSibling = printArea.nextSibling;
			movedElement = printArea;
			document.body.appendChild(printArea);
		}
	});

	window.addEventListener("afterprint", () => {
		document.body.removeAttribute("data-printing");

		if (movedElement && originalParent) {
			if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
				originalParent.insertBefore(movedElement, originalNextSibling);
			} else {
				originalParent.appendChild(movedElement);
			}
			movedElement = null;
			originalParent = null;
			originalNextSibling = null;
		}
	});
}

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

// Mirror Puppeteer's data-printing="true" setup for browser Ctrl+P printing.
// Without this, position: fixed rules for [data-pdf-header] and [data-pdf-footer]
// don't activate during native browser print, causing overlap and empty pages.
if (typeof window !== "undefined") {
	window.addEventListener("beforeprint", () => {
		document.body.setAttribute("data-printing", "true");
	});
	window.addEventListener("afterprint", () => {
		document.body.removeAttribute("data-printing");
	});
}

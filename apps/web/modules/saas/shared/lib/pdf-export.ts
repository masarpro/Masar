"use client";

import type { jsPDF as JsPDFType } from "jspdf";

// A4 dimensions in mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

/**
 * Capture an HTML element as a high-resolution canvas.
 */
async function captureElement(
	element: HTMLElement,
	scale: number = 2,
): Promise<HTMLCanvasElement> {
	const html2canvas = (await import("html2canvas-pro")).default;
	return html2canvas(element, {
		scale,
		useCORS: true,
		logging: false,
		backgroundColor: "#ffffff",
		ignoreElements: (el) => el.classList?.contains("no-print") || false,
	});
}

/**
 * Convert an HTML element to a multi-page A4 PDF.
 * If the container has [data-pdf-header], [data-pdf-body], [data-pdf-footer]
 * children, the header and footer are repeated on every page.
 * Otherwise falls back to single-canvas slicing (legacy behavior).
 *
 * Uses html2canvas-pro which supports oklch colors (Tailwind CSS 4).
 */
export async function exportToPDF(
	element: HTMLElement,
	filename: string,
): Promise<void> {
	const headerEl = element.querySelector(
		"[data-pdf-header]",
	) as HTMLElement | null;
	const bodyEl = element.querySelector(
		"[data-pdf-body]",
	) as HTMLElement | null;
	const footerEl = element.querySelector(
		"[data-pdf-footer]",
	) as HTMLElement | null;

	if (headerEl && bodyEl && footerEl) {
		return exportWithSections(headerEl, bodyEl, footerEl, element, filename);
	}

	// Fallback: legacy single-canvas slicing
	return exportLegacy(element, filename);
}

/**
 * New approach: capture header/body/footer separately,
 * compose each PDF page as header + body-slice + footer.
 */
async function exportWithSections(
	headerEl: HTMLElement,
	bodyEl: HTMLElement,
	footerEl: HTMLElement,
	container: HTMLElement,
	filename: string,
): Promise<void> {
	const { jsPDF } = await import("jspdf");
	const scale = 2;

	// Capture each section as a separate canvas
	const [headerCanvas, bodyCanvas, footerCanvas] = await Promise.all([
		captureElement(headerEl, scale),
		captureElement(bodyEl, scale),
		captureElement(footerEl, scale),
	]);

	// Conversion ratio: canvas pixels → mm
	// All sections share the same container width
	const containerWidth = container.offsetWidth;
	const pxToMm = A4_WIDTH / (containerWidth * scale);

	const headerHeightMm = headerCanvas.height * pxToMm;
	const footerHeightMm = footerCanvas.height * pxToMm;
	const bodyHeightMm = bodyCanvas.height * pxToMm;

	// Available space for body content on each page
	const contentAreaHeight = A4_HEIGHT - headerHeightMm - footerHeightMm;

	// If header + footer take up more than the page, fall back
	if (contentAreaHeight <= 10) {
		return exportLegacy(container, filename);
	}

	const pdf: JsPDFType = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "a4",
	});

	// Pre-render header and footer as data URLs (reused on every page)
	const headerImg = headerCanvas.toDataURL("image/jpeg", 0.95);
	const footerImg = footerCanvas.toDataURL("image/jpeg", 0.95);

	// Calculate how many pages we need
	const totalPages = Math.max(1, Math.ceil(bodyHeightMm / contentAreaHeight));

	// Source pixels per page of body content
	const bodyPxPerPage = bodyCanvas.height / totalPages;

	for (let page = 0; page < totalPages; page++) {
		if (page > 0) pdf.addPage();

		// Draw header at the top
		if (headerHeightMm > 0) {
			pdf.addImage(headerImg, "JPEG", 0, 0, A4_WIDTH, headerHeightMm);
		}

		// Slice body content for this page
		const sourceY = page * bodyPxPerPage;
		const sliceHeight = Math.min(bodyPxPerPage, bodyCanvas.height - sourceY);

		const sliceCanvas = document.createElement("canvas");
		sliceCanvas.width = bodyCanvas.width;
		sliceCanvas.height = Math.ceil(bodyPxPerPage);
		const ctx = sliceCanvas.getContext("2d");
		if (ctx) {
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
			ctx.drawImage(
				bodyCanvas,
				0,
				sourceY,
				bodyCanvas.width,
				sliceHeight,
				0,
				0,
				sliceCanvas.width,
				sliceHeight,
			);
		}

		const sliceImg = sliceCanvas.toDataURL("image/jpeg", 0.95);
		const sliceHeightMm = Math.min(
			(sliceHeight * pxToMm),
			contentAreaHeight,
		);
		pdf.addImage(
			sliceImg,
			"JPEG",
			0,
			headerHeightMm,
			A4_WIDTH,
			sliceHeightMm,
		);

		// Draw footer at the bottom
		if (footerHeightMm > 0) {
			pdf.addImage(
				footerImg,
				"JPEG",
				0,
				A4_HEIGHT - footerHeightMm,
				A4_WIDTH,
				footerHeightMm,
			);
		}
	}

	const finalName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
	pdf.save(finalName);
}

/**
 * Legacy fallback: capture entire element as one canvas, slice into pages.
 * No header/footer repetition. Used when data-pdf-* attributes are absent.
 */
async function exportLegacy(
	element: HTMLElement,
	filename: string,
): Promise<void> {
	const { jsPDF } = await import("jspdf");
	const scale = 2;

	const canvas = await captureElement(element, scale);

	const pdf: JsPDFType = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "a4",
	});

	const imgHeight = (canvas.height * A4_WIDTH) / canvas.width;
	let remainingHeight = imgHeight;
	let sourceY = 0;
	let pageNum = 0;
	const sourcePerMm = canvas.height / imgHeight;

	while (remainingHeight > 0) {
		if (pageNum > 0) pdf.addPage();

		const sliceHeightMm = Math.min(remainingHeight, A4_HEIGHT);
		const sliceHeightPx = sliceHeightMm * sourcePerMm;

		const pageCanvas = document.createElement("canvas");
		pageCanvas.width = canvas.width;
		pageCanvas.height = Math.ceil(sliceHeightPx);
		const ctx = pageCanvas.getContext("2d");
		if (ctx) {
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
			ctx.drawImage(
				canvas,
				0,
				sourceY,
				canvas.width,
				sliceHeightPx,
				0,
				0,
				pageCanvas.width,
				sliceHeightPx,
			);
		}

		pdf.addImage(
			pageCanvas.toDataURL("image/jpeg", 0.95),
			"JPEG",
			0,
			0,
			A4_WIDTH,
			sliceHeightMm,
		);

		sourceY += sliceHeightPx;
		remainingHeight -= A4_HEIGHT;
		pageNum++;
	}

	const finalName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
	pdf.save(finalName);
}

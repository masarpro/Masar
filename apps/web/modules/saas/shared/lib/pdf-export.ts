"use client";

import type { jsPDF as JsPDFType } from "jspdf";

/**
 * Convert an HTML element to a multi-page A4 PDF.
 * Uses html2canvas-pro which supports oklch colors (Tailwind CSS 4).
 */
export async function exportToPDF(
	element: HTMLElement,
	filename: string,
): Promise<void> {
	const html2canvas = (await import("html2canvas-pro")).default;
	const { jsPDF } = await import("jspdf");

	const canvas = await html2canvas(element, {
		scale: 2,
		useCORS: true,
		logging: false,
		backgroundColor: "#ffffff",
		ignoreElements: (el) => el.classList?.contains("no-print") || false,
	});

	const pdf: JsPDFType = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "a4",
	});

	const pageWidth = 210;
	const pageHeight = 297;
	const margin = 10;
	const contentWidth = pageWidth - margin * 2;
	const contentHeight = pageHeight - margin * 2;
	const imgHeight = (canvas.height * contentWidth) / canvas.width;

	let remainingHeight = imgHeight;
	let sourceY = 0;
	let pageNum = 0;

	while (remainingHeight > 0) {
		if (pageNum > 0) {
			pdf.addPage();
		}

		const sliceHeight = Math.min(remainingHeight, contentHeight);
		const sourceSliceHeight = (sliceHeight / imgHeight) * canvas.height;

		const pageCanvas = document.createElement("canvas");
		pageCanvas.width = canvas.width;
		pageCanvas.height = sourceSliceHeight;
		const ctx = pageCanvas.getContext("2d");
		if (ctx) {
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
			ctx.drawImage(
				canvas,
				0,
				sourceY,
				canvas.width,
				sourceSliceHeight,
				0,
				0,
				pageCanvas.width,
				pageCanvas.height,
			);
		}

		const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
		pdf.addImage(pageImgData, "JPEG", margin, margin, contentWidth, sliceHeight);

		sourceY += sourceSliceHeight;
		remainingHeight -= contentHeight;
		pageNum++;
	}

	const finalName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
	pdf.save(finalName);
}

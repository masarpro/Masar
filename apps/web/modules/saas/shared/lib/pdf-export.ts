"use client";

const A4_W = 210; // mm
const A4_H = 297; // mm
const GAP = 2; // mm safety gap between header↔body and body↔footer

/**
 * Capture an HTML element as a high-resolution canvas.
 * Forces RTL direction on the cloned element to fix Arabic text rendering.
 */
async function capture(
	el: HTMLElement,
	scale = 2,
): Promise<HTMLCanvasElement> {
	const html2canvas = (await import("html2canvas-pro")).default;
	return html2canvas(el, {
		scale,
		useCORS: true,
		logging: false,
		backgroundColor: "#ffffff",
		ignoreElements: (e) => e.classList?.contains("no-print") || false,
		onclone: (_doc, clonedEl) => {
			// Ensure RTL is preserved in the cloned subtree.
			// html2canvas clones only the target element, so the parent's
			// dir="rtl" is lost. We force it on the clone and all children.
			clonedEl.setAttribute("dir", "rtl");
			clonedEl.style.direction = "rtl";
			clonedEl.querySelectorAll("*").forEach((child) => {
				if (child instanceof HTMLElement && !child.getAttribute("dir")) {
					child.style.direction = "rtl";
				}
			});
		},
	});
}

/**
 * Convert canvas height to mm based on A4 width using aspect ratio.
 * This is mathematically exact — no dependency on container.offsetWidth.
 */
function canvasHeightToMm(
	canvas: HTMLCanvasElement,
	targetWidthMm: number,
): number {
	if (canvas.width === 0) return 0;
	return (canvas.height / canvas.width) * targetWidthMm;
}

/**
 * Create a canvas slice from a larger source canvas.
 */
function sliceCanvas(
	source: HTMLCanvasElement,
	sourceY: number,
	sliceHeight: number,
): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.width = source.width;
	c.height = Math.max(1, Math.round(sliceHeight));
	const ctx = c.getContext("2d");
	if (ctx) {
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, c.width, c.height);
		const actualHeight = Math.min(sliceHeight, source.height - sourceY);
		if (actualHeight > 0) {
			ctx.drawImage(
				source,
				0,
				Math.round(sourceY),
				source.width,
				Math.round(actualHeight),
				0,
				0,
				c.width,
				Math.round(actualHeight),
			);
		}
	}
	return c;
}

/**
 * Export an HTML document to a multi-page A4 PDF.
 * If the container has [data-pdf-header], [data-pdf-body], [data-pdf-footer]
 * children, header and footer are repeated on every page with a safety gap.
 * Otherwise falls back to single-canvas slicing.
 *
 * Uses html2canvas-pro which supports oklch colors (Tailwind CSS 4).
 */
export async function exportToPDF(
	container: HTMLElement,
	filename: string,
): Promise<void> {
	const headerEl = container.querySelector(
		"[data-pdf-header]",
	) as HTMLElement | null;
	const bodyEl = container.querySelector(
		"[data-pdf-body]",
	) as HTMLElement | null;
	const footerEl = container.querySelector(
		"[data-pdf-footer]",
	) as HTMLElement | null;

	if (headerEl && bodyEl && footerEl) {
		return exportWithSections(headerEl, bodyEl, footerEl, filename);
	}

	return fallbackExport(container, filename);
}

/**
 * Sectioned export: header + body slices + footer on every page.
 */
async function exportWithSections(
	headerEl: HTMLElement,
	bodyEl: HTMLElement,
	footerEl: HTMLElement,
	filename: string,
): Promise<void> {
	const { jsPDF } = await import("jspdf");
	const scale = 2;

	const [headerCv, bodyCv, footerCv] = await Promise.all([
		capture(headerEl, scale),
		capture(bodyEl, scale),
		capture(footerEl, scale),
	]);

	// Heights in mm via pure aspect ratio
	const hH = canvasHeightToMm(headerCv, A4_W);
	const fH = canvasHeightToMm(footerCv, A4_W);
	const totalBodyH = canvasHeightToMm(bodyCv, A4_W);

	// Available content area per page (with safety gaps)
	const contentArea = A4_H - hH - fH - GAP * 2;

	if (contentArea <= 10) {
		// Header + footer too tall — fall back
		const fullEl = headerEl.parentElement || headerEl;
		return fallbackExport(fullEl, filename);
	}

	const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

	const headerImg = headerCv.toDataURL("image/jpeg", 0.95);
	const footerImg = footerCv.toDataURL("image/jpeg", 0.95);

	const totalPages = Math.max(1, Math.ceil(totalBodyH / contentArea));
	const bodySlicePx = bodyCv.height / totalPages;

	for (let p = 0; p < totalPages; p++) {
		if (p > 0) pdf.addPage();

		// 1. Header at the top
		if (hH > 0) {
			pdf.addImage(headerImg, "JPEG", 0, 0, A4_W, hH);
		}

		// 2. Body slice after header + gap
		const srcY = p * bodySlicePx;
		const slice = sliceCanvas(bodyCv, srcY, bodySlicePx);
		const sliceImg = slice.toDataURL("image/jpeg", 0.95);
		const sliceH = Math.min(canvasHeightToMm(slice, A4_W), contentArea);
		const contentTop = hH + GAP;
		pdf.addImage(sliceImg, "JPEG", 0, contentTop, A4_W, sliceH);

		// 3. Footer at the bottom
		if (fH > 0) {
			pdf.addImage(footerImg, "JPEG", 0, A4_H - fH, A4_W, fH);
		}
	}

	const name = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
	pdf.save(name);
}

/**
 * Fallback: capture entire element as one canvas, slice into pages.
 */
async function fallbackExport(
	el: HTMLElement,
	filename: string,
): Promise<void> {
	const { jsPDF } = await import("jspdf");
	const cv = await capture(el);
	const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

	const totalH = canvasHeightToMm(cv, A4_W);
	const totalPages = Math.max(1, Math.ceil(totalH / A4_H));
	const slicePx = cv.height / totalPages;

	for (let p = 0; p < totalPages; p++) {
		if (p > 0) pdf.addPage();
		const slice = sliceCanvas(cv, p * slicePx, slicePx);
		const sliceH = canvasHeightToMm(slice, A4_W);
		pdf.addImage(
			slice.toDataURL("image/jpeg", 0.95),
			"JPEG",
			0,
			0,
			A4_W,
			sliceH,
		);
	}

	pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

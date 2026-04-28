// CSS rules pulled into a styled-jsx tag inside QuotePreview so they
// only apply when the print area is rendered. Mirrors the project's
// existing PDF rules from CLAUDE.md (no transform/filter/contain on
// ancestors of [data-pdf-footer], no display:none of the tfoot wrapper).
export const QUOTE_PRINT_CSS = `
@media print {
	@page {
		size: A4 portrait;
		margin: 15mm 12mm;
	}

	html, body {
		background: white !important;
	}

	body * {
		visibility: hidden;
	}

	#quote-print-area, #quote-print-area * {
		visibility: visible;
	}

	#quote-print-area {
		position: absolute;
		inset: 0;
		width: 100%;
		overflow: visible !important;
		transform: none !important;
		filter: none !important;
		contain: none !important;
		will-change: auto !important;
	}

	#quote-print-area * {
		transform: none !important;
		filter: none !important;
		contain: none !important;
		will-change: auto !important;
	}

	[data-pdf-footer] {
		position: fixed;
		bottom: 0;
		inset-inline-start: 0;
		inset-inline-end: 0;
		width: 100%;
		z-index: 10;
		background: white;
	}

	[data-pdf-body] {
		padding-bottom: var(--pdf-footer-reserve, 45mm);
	}

	thead {
		display: table-header-group;
	}

	tr, .quote-row {
		page-break-inside: avoid;
	}
}
`;

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const { html, filename = "document" } = await req.json();

		if (!html || typeof html !== "string") {
			return NextResponse.json(
				{ error: "HTML content is required" },
				{ status: 400 },
			);
		}

		// Choose Chromium based on environment
		let browser;

		if (process.env.VERCEL || process.env.NODE_ENV === "production") {
			const chromium = (await import("@sparticuz/chromium")).default;
			const puppeteer = (await import("puppeteer-core")).default;
			browser = await puppeteer.launch({
				args: chromium.args,
				defaultViewport: { width: 794, height: 1123 },
				executablePath: await chromium.executablePath(),
				headless: true,
			});
		} else {
			// Development: try puppeteer (bundled Chromium), then puppeteer-core with local Chrome
			try {
				const puppeteer = (await import("puppeteer")).default;
				browser = await puppeteer.launch({
					headless: true,
					args: ["--no-sandbox", "--disable-setuid-sandbox"],
					defaultViewport: { width: 794, height: 1123 },
				});
			} catch {
				const puppeteer = (await import("puppeteer-core")).default;
				browser = await puppeteer.launch({
					headless: true,
					channel: "chrome",
					args: ["--no-sandbox"],
					defaultViewport: { width: 794, height: 1123 },
				});
			}
		}

		const page = await browser.newPage();

		const fullHTML = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    direction: rtl;
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background: white;
  }
  @page { size: A4; margin: 0; }
  .print-table { width: 100%; border-collapse: collapse; }
  .print-table thead { display: table-header-group; }
  .print-table tfoot { display: table-footer-group; }
  .print-table tbody { display: table-row-group; }
  .print-cell { padding: 0; border: none; vertical-align: top; }
  tr { page-break-inside: avoid; }
  h3, h4, h5, h6 { page-break-after: avoid; }
  img { max-width: 100%; }
  .no-print, [data-print-hidden="true"] { display: none !important; }
</style>
</head>
<body>${html}</body>
</html>`;

		await page.setContent(fullHTML, {
			waitUntil: ["domcontentloaded", "networkidle0"],
			timeout: 15000,
		});

		// Wait for fonts
		await page.evaluate(() => document.fonts?.ready);

		const pdfBuffer = await page.pdf({
			format: "A4",
			margin: { top: "0", right: "0", bottom: "0", left: "0" },
			printBackground: true,
			preferCSSPageSize: true,
		});

		await browser.close();

		const safeName = filename.replace(/[^a-zA-Z0-9\u0600-\u06FF_\-. ]/g, "_");
		return new NextResponse(Buffer.from(pdfBuffer), {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}.pdf"`,
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("PDF generation error:", error);
		return NextResponse.json(
			{ error: "Failed to generate PDF" },
			{ status: 500 },
		);
	}
}

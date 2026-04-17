import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@repo/utils";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const { url, filename = "document" } = await req.json();

		if (!url || typeof url !== "string") {
			return NextResponse.json(
				{ error: "URL is required" },
				{ status: 400 },
			);
		}

		// Build full URL from path
		const baseUrl = getBaseUrl();
		const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

		// Launch browser
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

		// Forward cookies from the original request (sanitized for Puppeteer)
		const parsedUrl = new URL(fullUrl);
		const sanitizedCookies = req.cookies
			.getAll()
			.filter((c) => c.name && c.value)
			.map((c) => ({
				name: c.name,
				value: c.value,
				domain: parsedUrl.hostname,
				path: "/",
				httpOnly: false,
				secure: parsedUrl.protocol === "https:",
				sameSite: "Lax" as const,
			}));

		if (sanitizedCookies.length > 0) {
			await page.setCookie(...sanitizedCookies);
		}

		await page.goto(fullUrl, {
			waitUntil: "networkidle0",
			timeout: 20000,
		});

		// Wait for the content to render (React Query data loaded)
		await page
			.waitForSelector("#quotation-print-area, #invoice-print-area, [data-pdf-body]", {
				timeout: 10000,
			})
			.catch(() => {
				// Fallback: wait for any substantial content
				return page.waitForSelector("table, main", { timeout: 5000 });
			});

		// Wait for fonts and images
		await page.evaluate(() => document.fonts?.ready);
		await new Promise((r) => setTimeout(r, 1000));

		// Move print area to body root for isolation from layout wrappers.
		// Note: data-printing attribute is NOT set here — it's set after screenshots
		// so that CSS overrides don't distort layout during screenshot capture.
		await page.evaluate(() => {
			const printArea =
				document.getElementById("invoice-print-area") ||
				document.getElementById("quotation-print-area");

			if (
				printArea &&
				printArea.parentNode &&
				printArea.parentNode !== document.body
			) {
				document.body.appendChild(printArea);
			}
		});

		// === Screenshot Strategy: capture header/footer before hiding them ===
		// Puppeteer's displayHeaderFooter repeats headerTemplate/footerTemplate
		// on every page automatically. By capturing the rendered DOM elements
		// as images, we preserve the original design 100% (fonts, gradients, logo).
		await page
			.waitForSelector("[data-pdf-header]", { timeout: 5000 })
			.catch(() => null);
		await page
			.waitForSelector("[data-pdf-footer]", { timeout: 5000 })
			.catch(() => null);

		// Extra wait for fonts and images to fully render
		await page.evaluate(() => document.fonts?.ready);
		await new Promise((r) => setTimeout(r, 500));

		// Capture header
		const headerElement = await page.$("[data-pdf-header]");
		let headerBase64: string | null = null;
		let headerHeightMm = 0;
		if (headerElement) {
			const box = await headerElement.boundingBox();
			if (box && box.height > 0) {
				const buf = await headerElement.screenshot({
					type: "png",
					omitBackground: false,
				});
				headerBase64 = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
				// px → mm (96 DPI: 1mm = 3.7795275591px)
				headerHeightMm = box.height / 3.7795275591;
			}
		}

		// Capture footer
		const footerElement = await page.$("[data-pdf-footer]");
		let footerBase64: string | null = null;
		let footerHeightMm = 0;
		if (footerElement) {
			const box = await footerElement.boundingBox();
			if (box && box.height > 0) {
				const buf = await footerElement.screenshot({
					type: "png",
					omitBackground: false,
				});
				footerBase64 = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
				footerHeightMm = box.height / 3.7795275591;
			}
		}

		// Now set data-printing="puppeteer" and hide inline header/footer
		// (they render via headerTemplate/footerTemplate as images from screenshots).
		await page.evaluate(() => {
			document.body.setAttribute("data-printing", "puppeteer");
		});
		await page.addStyleTag({
			content: `[data-pdf-header], [data-pdf-footer] { display: none !important; }`,
		});

		// Small wait for CSS to apply after DOM mutation
		await new Promise((r) => setTimeout(r, 100));

		// Build templates — font-size:0/line-height:0 eliminates ghost spacing
		const headerTemplate = headerBase64
			? `<div style="margin:0;padding:0;width:100%;font-size:0;line-height:0;"><img src="${headerBase64}" style="width:210mm;display:block;margin:0;padding:0;" /></div>`
			: `<div></div>`;
		const footerTemplate = footerBase64
			? `<div style="margin:0;padding:0;width:100%;font-size:0;line-height:0;"><img src="${footerBase64}" style="width:210mm;display:block;margin:0;padding:0;" /></div>`
			: `<div></div>`;

		// Margins = measured heights + 3mm safety (fallback 10mm if no element)
		const topMargin = headerHeightMm > 0 ? `${Math.ceil(headerHeightMm) + 3}mm` : "10mm";
		const bottomMargin = footerHeightMm > 0 ? `${Math.ceil(footerHeightMm) + 3}mm` : "10mm";

		// Generate PDF with repeating header/footer via Puppeteer templates
		const pdfBuffer = await page.pdf({
			format: "A4",
			displayHeaderFooter: true,
			headerTemplate,
			footerTemplate,
			margin: {
				top: topMargin,
				right: "0",
				bottom: bottomMargin,
				left: "0",
			},
			printBackground: true,
			preferCSSPageSize: false,
		});

		await browser.close();

		const safeName = filename.replace(
			/[^a-zA-Z0-9\u0600-\u06FF_\-. ]/g,
			"_",
		);
		return new NextResponse(Buffer.from(pdfBuffer), {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}.pdf`,
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("PDF generation error:", error);
		return NextResponse.json(
			{ error: String(error) },
			{ status: 500 },
		);
	}
}

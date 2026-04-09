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

		// Move print area to body root and mark for CSS targeting.
		// This mimics what the beforeprint event does for browser printing.
		// Without this, the print area stays buried deep in the DOM and the
		// body[data-printing] > *:not(#print-area) selector cannot isolate it.
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

			document.body.setAttribute("data-printing", "true");
		});

		// Small wait for CSS to apply after DOM mutation
		await new Promise((r) => setTimeout(r, 100));

		// Generate PDF — @media print CSS handles hiding sidebar/toolbar
		const pdfBuffer = await page.pdf({
			format: "A4",
			margin: { top: "0", right: "0", bottom: "0", left: "0" },
			printBackground: true,
			preferCSSPageSize: true,
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

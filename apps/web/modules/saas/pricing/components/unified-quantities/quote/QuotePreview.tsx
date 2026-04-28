"use client";

import { useEffect } from "react";
import type { QuantityItem } from "../types";
import { QUOTE_PRINT_CSS } from "./pdf-styles";
import type { QuoteData } from "./types";

interface Props {
	data: QuoteData;
	items: QuantityItem[];
	totalSellAmount: number;
	totalProfitAmount: number;
	totalGrossCost: number;
	vatAmount: number;
	grossWithVat: number;
}

const fmt = (n: number) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(n);

const fmtQty = (n: unknown) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(n ?? 0));

const formatDate = (iso: string) => {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleDateString("ar-SA", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	} catch {
		return iso;
	}
};

export function QuotePreview({
	data,
	items,
	totalSellAmount,
	totalGrossCost,
	vatAmount,
	grossWithVat,
}: Props) {
	useEffect(() => {
		const measure = () => {
			const footer = document.querySelector("[data-pdf-footer]");
			if (footer) {
				const h = footer.getBoundingClientRect().height;
				const reserveMm = Math.max(40, Math.ceil(h * 0.265 + 8));
				document.documentElement.style.setProperty(
					"--pdf-footer-reserve",
					`${reserveMm}mm`,
				);
			}
		};
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, []);

	const enabledItems = items.filter((i) => i.isEnabled);
	const subtotal = data.includeVAT ? totalSellAmount : totalSellAmount;
	const total = data.includeVAT ? grossWithVat : totalSellAmount;

	return (
		<>
			<style jsx global>{QUOTE_PRINT_CSS}</style>

			<div
				id="quote-print-area"
				dir="rtl"
				className="rounded-md border bg-white p-6 text-sm text-slate-900 shadow-sm dark:bg-white dark:text-slate-900 print:rounded-none print:border-0 print:shadow-none"
			>
				<div data-pdf-body>
					<header className="mb-6 flex items-start justify-between border-b pb-4">
						<div>
							<h1 className="text-2xl font-bold">عرض سعر</h1>
							<p className="mt-1 text-xs text-slate-600">
								{data.quoteNumber || "—"}
							</p>
						</div>
						<div className="text-end text-xs text-slate-600">
							<p>
								تاريخ الإصدار:{" "}
								<span className="tabular-nums">
									{formatDate(data.issueDate)}
								</span>
							</p>
							<p>
								ساري حتى:{" "}
								<span className="tabular-nums">
									{formatDate(data.validUntil)}
								</span>
							</p>
						</div>
					</header>

					<section className="mb-5 grid grid-cols-2 gap-6">
						<div>
							<h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
								العميل
							</h3>
							<p className="font-semibold">{data.clientName || "—"}</p>
							{data.clientAddress && <p>{data.clientAddress}</p>}
							{data.clientPhone && (
								<p className="tabular-nums">{data.clientPhone}</p>
							)}
							{data.clientEmail && <p>{data.clientEmail}</p>}
						</div>
						<div>
							<h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
								المشروع
							</h3>
							<p className="font-semibold">{data.projectName || "—"}</p>
							{data.projectAddress && <p>{data.projectAddress}</p>}
						</div>
					</section>

					<section className="mb-5">
						<table className="w-full border-collapse text-xs">
							<thead className="border-y bg-slate-100 text-slate-700">
								<tr>
									<th className="px-2 py-2 text-start">#</th>
									<th className="px-2 py-2 text-start">البند</th>
									<th className="px-2 py-2 text-end">الكمية</th>
									<th className="px-2 py-2 text-end">الوحدة</th>
									<th className="px-2 py-2 text-end">السعر</th>
									<th className="px-2 py-2 text-end">الإجمالي</th>
								</tr>
							</thead>
							<tbody>
								{enabledItems.map((item, idx) => (
									<tr
										key={item.id}
										className="quote-row border-b align-top"
									>
										<td className="px-2 py-2 tabular-nums text-slate-500">
											{idx + 1}
										</td>
										<td className="px-2 py-2">
											<div className="font-medium">
												{item.displayName}
											</div>
											{item.specMaterialName && (
												<div className="text-[11px] text-slate-500">
													{item.specMaterialName}
													{item.specMaterialBrand
														? ` — ${item.specMaterialBrand}`
														: ""}
												</div>
											)}
										</td>
										<td className="px-2 py-2 text-end tabular-nums">
											{fmtQty(item.effectiveQuantity)}
										</td>
										<td className="px-2 py-2 text-end">{item.unit}</td>
										<td className="px-2 py-2 text-end tabular-nums">
											{fmt(Number(item.sellUnitPrice ?? 0))}
										</td>
										<td className="px-2 py-2 text-end tabular-nums">
											{fmt(Number(item.sellTotalAmount ?? 0))}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</section>

					<section className="mb-6 ms-auto w-full max-w-md space-y-1 text-sm">
						<div className="flex items-center justify-between">
							<span className="text-slate-600">الإجمالي قبل الضريبة</span>
							<span className="tabular-nums">{fmt(subtotal)} ر.س</span>
						</div>
						{data.includeVAT && (
							<div className="flex items-center justify-between">
								<span className="text-slate-600">VAT 15%</span>
								<span className="tabular-nums">{fmt(vatAmount)} ر.س</span>
							</div>
						)}
						<div className="flex items-center justify-between border-t pt-2 text-base font-bold">
							<span>الإجمالي النهائي</span>
							<span className="tabular-nums">{fmt(total)} ر.س</span>
						</div>
						<p className="mt-1 text-[10px] text-slate-500">
							التكلفة المرجعية:{" "}
							<span className="tabular-nums">{fmt(totalGrossCost)}</span> ر.س
						</p>
					</section>

					<section className="mb-6 space-y-3 text-xs">
						{data.paymentTerms && (
							<div>
								<h4 className="font-semibold">شروط الدفع</h4>
								<p className="whitespace-pre-line text-slate-700">
									{data.paymentTerms}
								</p>
							</div>
						)}
						{data.executionDuration && (
							<div>
								<h4 className="font-semibold">مدة التنفيذ</h4>
								<p className="whitespace-pre-line text-slate-700">
									{data.executionDuration}
								</p>
							</div>
						)}
						{data.warranty && (
							<div>
								<h4 className="font-semibold">الضمان</h4>
								<p className="whitespace-pre-line text-slate-700">
									{data.warranty}
								</p>
							</div>
						)}
						{data.notes && (
							<div>
								<h4 className="font-semibold">ملاحظات</h4>
								<p className="whitespace-pre-line text-slate-700">
									{data.notes}
								</p>
							</div>
						)}
					</section>

					<section className="mt-10 grid grid-cols-2 gap-6 text-xs">
						<div>
							<p className="border-t pt-2 text-slate-700">توقيع المقاول</p>
						</div>
						<div>
							<p className="border-t pt-2 text-slate-700">توقيع العميل</p>
						</div>
					</section>
				</div>

				<footer
					data-pdf-footer
					className="mt-8 border-t pt-3 text-center text-[10px] text-slate-500"
				>
					<p>
						هذا العرض ساري لمدة 30 يوماً من تاريخ الإصدار. الأسعار قابلة
						للتفاوض.
					</p>
				</footer>
			</div>
		</>
	);
}

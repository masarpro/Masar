"use client";

import { useTranslations } from "next-intl";

interface DocumentPrintHeaderProps {
	documentTitle: string;
	documentTitleEn: string;
	documentNo: string;
	date: string;
}

/**
 * Bilingual document header — hidden on screen, visible only when printing.
 * Used by receipt vouchers, payment vouchers, handover protocols.
 */
export function DocumentPrintHeader({
	documentTitle,
	documentTitleEn,
	documentNo,
	date,
}: DocumentPrintHeaderProps) {
	const t = useTranslations();

	return (
		<div className="hidden print:block mb-6">
			<div className="text-center border-b-2 border-black pb-4 mb-4">
				<h1 className="text-2xl font-bold">{documentTitle}</h1>
				<p className="text-sm text-gray-600 mt-1">{documentTitleEn}</p>
			</div>
			<div className="flex justify-between text-sm mb-4">
				<div>
					<span className="font-medium">{t("print.documentNo")}:</span>{" "}
					<span className="font-mono">{documentNo}</span>
				</div>
				<div>
					<span className="font-medium">{t("print.date")}:</span> {date}
				</div>
			</div>
		</div>
	);
}

/**
 * Signature box row — renders N signature boxes side by side for print.
 */
export function SignatureBoxes({
	signatures,
}: {
	signatures: Array<{ label: string; name?: string }>;
}) {
	return (
		<div className="hidden print:block mt-12 pt-6 border-t border-gray-300">
			<div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${signatures.length}, 1fr)` }}>
				{signatures.map((sig, idx) => (
					<div key={idx} className="text-center">
						<p className="text-sm font-medium mb-8">{sig.label}</p>
						{sig.name && <p className="text-sm mb-2">{sig.name}</p>}
						<div className="border-b border-black mx-4" />
						<p className="text-xs text-gray-500 mt-1">{sig.label}</p>
					</div>
				))}
			</div>
		</div>
	);
}

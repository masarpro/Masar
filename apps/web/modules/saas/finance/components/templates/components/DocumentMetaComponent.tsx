"use client";

import { useTranslations } from "next-intl";

interface DocumentMetaComponentProps {
	settings: {
		showDocumentNumber?: boolean;
		showDate?: boolean;
		showDueDate?: boolean;
		showDocumentTypeLabel?: boolean;
		layout?: "centered" | "bar" | "card";
	};
	documentInfo?: {
		number?: string;
		date?: string;
		validUntil?: string;
		invoiceType?: string;
	};
	documentType?: "quotation" | "invoice" | "letter";
	primaryColor?: string;
	secondaryColor?: string;
}

export function DocumentMetaComponent({
	settings,
	documentInfo,
	documentType = "invoice",
	primaryColor = "#3b82f6",
	secondaryColor,
}: DocumentMetaComponentProps) {
	const t = useTranslations();
	const {
		showDocumentNumber = true,
		showDate = true,
		showDueDate = true,
		showDocumentTypeLabel = false,
		layout = "centered",
	} = settings;

	const accent = secondaryColor || primaryColor;

	const hasContent =
		showDocumentTypeLabel ||
		(showDocumentNumber && documentInfo?.number) ||
		(showDate && documentInfo?.date) ||
		(showDueDate && documentInfo?.validUntil);

	if (!hasContent) return null;

	const getDocTypeLabel = () => {
		switch (documentType) {
			case "invoice":
				return t("finance.templates.preview.invoice");
			case "letter":
				return t("finance.templates.types.letter");
			default:
				return t("finance.templates.preview.quotation");
		}
	};

	// ─── Bar Layout ─────────────────────────────────────────────────────
	if (layout === "bar") {
		return (
			<div>
				{showDocumentTypeLabel && (
					<div className="text-center py-2">
						<h2
							className="text-lg font-bold"
							style={{ color: primaryColor }}
						>
							{getDocTypeLabel()}
						</h2>
					</div>
				)}
				<div
					className="flex items-center justify-around py-2 px-6"
					style={{
						background: `linear-gradient(90deg, ${primaryColor}, ${accent})`,
						color: "#ffffff",
						fontSize: "12px",
					}}
				>
					{showDocumentNumber && documentInfo?.number && (
						<div>
							<span className="opacity-70">
								{t("finance.templates.preview.documentNumber")}:
							</span>{" "}
							<strong>{documentInfo.number}</strong>
						</div>
					)}
					{showDate && documentInfo?.date && (
						<div>
							<span className="opacity-70">
								{t("finance.templates.preview.date")}:
							</span>{" "}
							<strong>{documentInfo.date}</strong>
						</div>
					)}
					{showDueDate && documentInfo?.validUntil && (
						<div>
							<span className="opacity-70">
								{t("finance.templates.preview.validUntil")}:
							</span>{" "}
							<strong>{documentInfo.validUntil}</strong>
						</div>
					)}
				</div>
			</div>
		);
	}

	// ─── Card Layout ────────────────────────────────────────────────────
	if (layout === "card") {
		return (
			<div className="py-3 px-2">
				{showDocumentTypeLabel && (
					<div className="text-center mb-2">
						<h2
							className="text-lg font-bold"
							style={{ color: primaryColor }}
						>
							{getDocTypeLabel()}
						</h2>
					</div>
				)}
				<div
					className="rounded-lg p-3"
					style={{
						background: `${primaryColor}08`,
						border: `1px solid ${primaryColor}20`,
					}}
				>
					<div className="flex items-center justify-around text-sm">
						{showDocumentNumber && documentInfo?.number && (
							<div className="text-center">
								<p
									className="text-[10px] font-medium mb-0.5"
									style={{ color: primaryColor }}
								>
									{t("finance.templates.preview.documentNumber")}
								</p>
								<p className="font-bold text-slate-900">
									{documentInfo.number}
								</p>
							</div>
						)}
						{showDate && documentInfo?.date && (
							<div className="text-center">
								<p
									className="text-[10px] font-medium mb-0.5"
									style={{ color: primaryColor }}
								>
									{t("finance.templates.preview.date")}
								</p>
								<p className="font-bold text-slate-900">
									{documentInfo.date}
								</p>
							</div>
						)}
						{showDueDate && documentInfo?.validUntil && (
							<div className="text-center">
								<p
									className="text-[10px] font-medium mb-0.5"
									style={{ color: primaryColor }}
								>
									{t("finance.templates.preview.validUntil")}
								</p>
								<p className="font-bold text-slate-900">
									{documentInfo.validUntil}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	// ─── Centered Layout (default) ──────────────────────────────────────
	return (
		<div className="py-3 text-center">
			{showDocumentTypeLabel && (
				<h2
					className="text-lg font-bold mb-2"
					style={{ color: primaryColor }}
				>
					{getDocTypeLabel()}
				</h2>
			)}
			<div className="flex items-center justify-center gap-8 text-sm">
				{showDocumentNumber && documentInfo?.number && (
					<div>
						<span className="text-slate-500">
							{t("finance.templates.preview.documentNumber")}:
						</span>{" "}
						<strong className="text-slate-900">
							{documentInfo.number}
						</strong>
					</div>
				)}
				{showDate && documentInfo?.date && (
					<div>
						<span className="text-slate-500">
							{t("finance.templates.preview.date")}:
						</span>{" "}
						<strong className="text-slate-900">
							{documentInfo.date}
						</strong>
					</div>
				)}
				{showDueDate && documentInfo?.validUntil && (
					<div>
						<span className="text-slate-500">
							{t("finance.templates.preview.validUntil")}:
						</span>{" "}
						<strong className="text-slate-900">
							{documentInfo.validUntil}
						</strong>
					</div>
				)}
			</div>
			<div
				className="mx-auto mt-2 h-px w-48"
				style={{ background: `${primaryColor}30` }}
			/>
		</div>
	);
}

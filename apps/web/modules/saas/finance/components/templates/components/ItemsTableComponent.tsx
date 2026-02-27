"use client";

import { useTranslations, useLocale } from "next-intl";
import { Currency } from "../../shared/Currency";

interface Item {
	description: string;
	descriptionEn?: string;
	quantity: number;
	unit: string;
	unitEn?: string;
	unitPrice: number;
	totalPrice: number;
}

interface ItemsTableComponentProps {
	settings: {
		showQuantity?: boolean;
		showUnit?: boolean;
		showUnitPrice?: boolean;
		showRowNumbers?: boolean;
		alternatingColors?: boolean;
		// Custom colors
		headerBackground?: string;
		headerTextColor?: string;
		alternateRowColor?: string;
		rowNumberColor?: string;
		rowBorderColor?: string;
		headerRowNumberColor?: string;
		borderRadius?: string;
		// Header style
		headerStyle?: "filled" | "underline";
		headerBorderColor?: string;
		headerBorderWidth?: string;
		// Row number style
		rowNumberStyle?: "default" | "circle";
		rowNumberBackground?: string;
		// Border spacing
		borderSpacing?: string;
	};
	items?: Item[];
	primaryColor?: string;
	currency?: string;
}

export function ItemsTableComponent({
	settings,
	items,
	primaryColor = "#3b82f6",
	currency = "SAR",
}: ItemsTableComponentProps) {
	const t = useTranslations();
	const locale = useLocale();
	const {
		showQuantity = true,
		showUnit = true,
		showUnitPrice = true,
		showRowNumbers = true,
		alternatingColors = true,
		headerBackground,
		headerTextColor,
		alternateRowColor,
		rowNumberColor,
		rowBorderColor,
		headerRowNumberColor,
		borderRadius = "0",
		headerStyle = "filled",
		headerBorderColor,
		headerBorderWidth = "2px",
		rowNumberStyle = "default",
		rowNumberBackground,
		borderSpacing,
	} = settings;

	const defaultItems: Item[] = [
		{
			description: t("finance.templates.preview.sampleItem1"),
			descriptionEn: "Consulting Services",
			quantity: 5,
			unit: t("finance.templates.preview.unit"),
			unitEn: "Unit",
			unitPrice: 1000,
			totalPrice: 5000,
		},
		{
			description: t("finance.templates.preview.sampleItem2"),
			descriptionEn: "Software Development",
			quantity: 10,
			unit: t("finance.templates.preview.unit"),
			unitEn: "Hour",
			unitPrice: 500,
			totalPrice: 5000,
		},
		{
			description: t("finance.templates.preview.sampleItem3"),
			descriptionEn: "Technical Support",
			quantity: 2,
			unit: t("finance.templates.preview.unit"),
			unitEn: "Unit",
			unitPrice: 2500,
			totalPrice: 5000,
		},
	];

	const displayItems = items && items.length > 0 ? items : defaultItems;

	const formatNumber = (num: number) => {
		return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(num);
	};

	// Header colors
	const hdrBg = headerBackground || primaryColor;
	const hdrText = headerTextColor || "#ffffff";
	const hdrNumColor = headerRowNumberColor || hdrText;

	// Determine if underline style
	const isUnderline = headerStyle === "underline";

	// Row number renderer
	const renderRowNumber = (num: number) => {
		if (rowNumberStyle === "circle") {
			return (
				<span
					className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
					style={{
						background: rowNumberBackground || `${primaryColor}15`,
						color: rowNumberColor || primaryColor,
					}}
				>
					{formatNumber(num)}
				</span>
			);
		}
		return (
			<span
				className="font-medium"
				style={{ color: rowNumberColor || undefined }}
			>
				{formatNumber(num)}
			</span>
		);
	};

	return (
		<div className="py-4">
			<table
				className="w-full"
				style={{
					borderCollapse: borderSpacing ? "separate" : "collapse",
					borderSpacing: borderSpacing ? `0 ${borderSpacing}` : undefined,
				}}
				dir={locale === "ar" ? "rtl" : "ltr"}
			>
				<thead>
					<tr
						style={
							isUnderline
								? { borderBottom: `${headerBorderWidth} solid ${headerBorderColor || primaryColor}` }
								: { backgroundColor: hdrBg }
						}
						className={isUnderline ? "" : "text-white"}
					>
						{showRowNumbers && (
							<th
								className="py-3 px-4 text-center font-medium text-sm w-12"
								style={
									isUnderline
										? {
												color: headerTextColor || "#94a3b8",
												fontWeight: 600,
												fontSize: "12px",
											}
										: {
												color: hdrNumColor,
												borderTopRightRadius: borderRadius,
											}
								}
							>
								#
							</th>
						)}
						<th
							className={`py-3 px-4 font-medium text-sm text-start`}
							style={
								isUnderline
									? {
											color: headerTextColor || "#94a3b8",
											fontWeight: 600,
											fontSize: "12px",
										}
									: {
											color: hdrText,
											borderTopRightRadius:
												!showRowNumbers ? borderRadius : undefined,
										}
							}
						>
							{t("finance.templates.preview.description")}
						</th>
						{showQuantity && (
							<th
								className="py-3 px-4 text-center font-medium text-sm w-20"
								style={
									isUnderline
										? {
												color: headerTextColor || "#94a3b8",
												fontWeight: 600,
												fontSize: "12px",
											}
										: { color: hdrText }
								}
							>
								{t("finance.templates.preview.quantity")}
							</th>
						)}
						{showUnit && (
							<th
								className="py-3 px-4 text-center font-medium text-sm w-24"
								style={
									isUnderline
										? {
												color: headerTextColor || "#94a3b8",
												fontWeight: 600,
												fontSize: "12px",
											}
										: { color: hdrText }
								}
							>
								{t("finance.templates.preview.unitCol")}
							</th>
						)}
						{showUnitPrice && (
							<th
								className="py-3 px-4 text-end font-medium text-sm w-32"
								style={
									isUnderline
										? {
												color: headerTextColor || "#94a3b8",
												fontWeight: 600,
												fontSize: "12px",
											}
										: { color: hdrText }
								}
							>
								{t("finance.templates.preview.unitPrice")}
							</th>
						)}
						<th
							className="py-3 px-4 text-end font-medium text-sm w-32"
							style={
								isUnderline
									? {
											color: headerTextColor || "#94a3b8",
											fontWeight: 600,
											fontSize: "12px",
										}
									: {
											color: hdrText,
											borderTopLeftRadius: borderRadius,
										}
							}
						>
							{t("finance.templates.preview.total")}
						</th>
					</tr>
				</thead>
				<tbody>
					{displayItems.map((item, index) => {
						const isEven = index % 2 === 0;
						const rowBg = alternatingColors
							? isEven
								? alternateRowColor || "#f8fafc"
								: "#ffffff"
							: "#ffffff";
						const rowBorder = rowBorderColor || "#f1f5f9";

						return (
							<tr
								key={index}
								style={{
									backgroundColor: rowBg,
									borderBottom: `1px solid ${rowBorder}`,
								}}
							>
								{showRowNumbers && (
									<td className="py-3 px-4 text-center text-sm">
										{renderRowNumber(index + 1)}
									</td>
								)}
								<td className="py-3 px-4 text-sm text-slate-900">
									<span>{item.description}</span>
									{item.descriptionEn &&
										item.descriptionEn !== item.description && (
											<span
												className="block text-xs text-slate-400 mt-0.5"
												dir="ltr"
											>
												{item.descriptionEn}
											</span>
										)}
								</td>
								{showQuantity && (
									<td
										className="py-3 px-4 text-center text-sm text-slate-600 font-medium"
										dir="ltr"
									>
										{formatNumber(item.quantity)}
									</td>
								)}
								{showUnit && (
									<td className="py-3 px-4 text-center text-sm text-slate-600">
										{item.unit}
									</td>
								)}
								{showUnitPrice && (
									<td
										className="py-3 px-4 text-end text-sm text-slate-600"
										dir="ltr"
									>
										<Currency amount={item.unitPrice} />
									</td>
								)}
								<td
									className="py-3 px-4 text-end text-sm font-semibold text-slate-900"
									dir="ltr"
								>
									<Currency amount={item.totalPrice} />
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

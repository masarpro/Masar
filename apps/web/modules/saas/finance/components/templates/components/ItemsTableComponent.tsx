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

	// Format number with proper locale
	const formatNumber = (num: number) => {
		return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(num);
	};

	// Calculate column count for RTL direction handling
	const columnCount = 2 + (showQuantity ? 1 : 0) + (showUnit ? 1 : 0) + (showUnitPrice ? 1 : 0) + (showRowNumbers ? 1 : 0);

	return (
		<div className="py-4">
			<table className="w-full border-collapse" dir={locale === "ar" ? "rtl" : "ltr"}>
				<thead>
					<tr style={{ backgroundColor: primaryColor }} className="text-white">
						{showRowNumbers && (
							<th className="py-3 px-4 text-center font-medium text-sm first:rounded-tr-lg rtl:first:rounded-tl-lg rtl:first:rounded-tr-none w-12">
								#
							</th>
						)}
						<th className={`py-3 px-4 font-medium text-sm ${locale === "ar" ? "text-start" : "text-start"} ${!showRowNumbers ? "first:rounded-tr-lg rtl:first:rounded-tl-lg rtl:first:rounded-tr-none" : ""}`}>
							{t("finance.templates.preview.description")}
						</th>
						{showQuantity && (
							<th className="py-3 px-4 text-center font-medium text-sm w-20">
								{t("finance.templates.preview.quantity")}
							</th>
						)}
						{showUnit && (
							<th className="py-3 px-4 text-center font-medium text-sm w-24">
								{t("finance.templates.preview.unitCol")}
							</th>
						)}
						{showUnitPrice && (
							<th className="py-3 px-4 text-end font-medium text-sm w-32">
								{t("finance.templates.preview.unitPrice")}
							</th>
						)}
						<th className="py-3 px-4 text-end font-medium text-sm last:rounded-tl-lg rtl:last:rounded-tr-lg rtl:last:rounded-tl-none w-32">
							{t("finance.templates.preview.total")}
						</th>
					</tr>
				</thead>
				<tbody>
					{displayItems.map((item, index) => {
						const rowBgColor = alternatingColors
							? index % 2 === 0
								? "bg-slate-50"
								: "bg-white"
							: "bg-white";

						return (
							<tr key={index} className={`${rowBgColor} border-b border-slate-100`}>
								{showRowNumbers && (
									<td className="py-3 px-4 text-center text-sm text-slate-600 font-medium">
										{formatNumber(index + 1)}
									</td>
								)}
								<td className="py-3 px-4 text-sm text-slate-900">
									<span>{item.description}</span>
									{item.descriptionEn && item.descriptionEn !== item.description && (
										<span className="block text-xs text-slate-400 mt-0.5" dir="ltr">
											{item.descriptionEn}
										</span>
									)}
								</td>
								{showQuantity && (
									<td className="py-3 px-4 text-center text-sm text-slate-600 font-medium" dir="ltr">
										{formatNumber(item.quantity)}
									</td>
								)}
								{showUnit && (
									<td className="py-3 px-4 text-center text-sm text-slate-600">
										{item.unit}
									</td>
								)}
								{showUnitPrice && (
									<td className="py-3 px-4 text-end text-sm text-slate-600" dir="ltr">
										<Currency amount={item.unitPrice} currency={currency} />
									</td>
								)}
								<td className="py-3 px-4 text-end text-sm font-semibold text-slate-900" dir="ltr">
									<Currency amount={item.totalPrice} currency={currency} />
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

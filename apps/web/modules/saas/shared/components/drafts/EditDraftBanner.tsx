"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Pencil, ExternalLink, Trash2 } from "lucide-react";

interface EditDraftBannerProps {
	/** رقم المستند الأصلي (الفاتورة/عرض السعر) */
	sourceNumber?: string | null;
	/** رابط عرض الأصل */
	sourceHref?: string;
	/** تجاهل المسودة */
	onDiscard?: () => void;
}

export function EditDraftBanner({ sourceNumber, sourceHref, onDiscard }: EditDraftBannerProps) {
	const t = useTranslations();

	return (
		<div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-chart-1/30 bg-chart-1/10 px-4 py-2.5 text-chart-1">
			<div className="flex items-center gap-2 text-sm font-medium">
				<Pencil className="h-4 w-4 shrink-0" />
				<span>
					{t("drafts.editBanner").replace("{number}", sourceNumber ?? "")}
				</span>
			</div>
			<div className="flex items-center gap-3 text-xs">
				{sourceHref && (
					<Link href={sourceHref} className="inline-flex items-center gap-1 hover:underline">
						<ExternalLink className="h-3.5 w-3.5" />
						{t("drafts.viewOriginal")}
					</Link>
				)}
				{onDiscard && (
					<button
						type="button"
						onClick={onDiscard}
						className="inline-flex items-center gap-1 text-destructive hover:underline"
					>
						<Trash2 className="h-3.5 w-3.5" />
						{t("drafts.discard")}
					</button>
				)}
			</div>
		</div>
	);
}

"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export function PageHeader({
	title,
	subtitle,
	backHref,
	backLabel,
}: {
	title: string;
	subtitle?: string;
	backHref?: string;
	backLabel?: string;
}) {
	return (
		<div className="mb-8">
			{backHref && (
				<Link
					href={backHref}
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
				>
					<ArrowLeftIcon className="h-4 w-4 rtl-flip" />
					{backLabel || "Back"}
				</Link>
			)}
			{/* Botly page title = Headline/h3 36px bold (Top bar 69:1766);
			    line-height raised for Arabic (RTL rule 5: Figma lh 32 < size) */}
			<h2 className="font-bold text-2xl lg:text-4xl lg:leading-snug">{title}</h2>
			{subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
		</div>
	);
}

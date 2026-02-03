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
					<ArrowLeftIcon className="h-4 w-4" />
					{backLabel || "Back"}
				</Link>
			)}
			<h2 className="font-bold text-2xl lg:text-3xl">{title}</h2>
			{subtitle && <p className="mt-1 opacity-60">{subtitle}</p>}
		</div>
	);
}

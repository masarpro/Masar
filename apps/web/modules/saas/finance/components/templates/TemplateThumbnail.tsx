"use client";

import { useMemo } from "react";
import { TemplateRenderer } from "./renderer/TemplateRenderer";
import type { OrganizationData } from "./renderer/TemplateRenderer";
import type { TemplateElement, TemplateSettings } from "../../lib/default-templates";
import { getSampleData } from "../../lib/sample-preview-data";

interface TemplateThumbnailProps {
	elements: TemplateElement[];
	settings: TemplateSettings;
	templateType: "QUOTATION" | "INVOICE";
	organization?: OrganizationData;
	className?: string;
}

export function TemplateThumbnail({
	elements,
	settings,
	templateType,
	organization,
	className = "",
}: TemplateThumbnailProps) {
	const docType = templateType.toLowerCase() as "quotation" | "invoice";
	const sampleData = useMemo(() => getSampleData(docType, settings), [docType, settings]);

	const template = useMemo(
		() => ({ elements, settings }),
		[elements, settings],
	);

	return (
		<div
			className={`relative w-full overflow-hidden rounded-lg bg-white ${className}`}
			style={{ aspectRatio: "210 / 297" }}
		>
			<div
				className="origin-top-right pointer-events-none select-none"
				style={{
					width: "794px",
					transform: "scale(var(--thumb-scale, 0.22))",
					transformOrigin: "top right",
				}}
			>
				<TemplateRenderer
					data={sampleData}
					template={template}
					organization={organization}
					documentType={docType}
					interactive={false}
				/>
			</div>
		</div>
	);
}

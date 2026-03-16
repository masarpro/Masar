"use client";

import type { useTranslations } from "next-intl";
import { Switch } from "@ui/components/switch";
import { ChevronDownIcon } from "lucide-react";
import type { TemplateElement } from "../TemplateCanvas";
import { ELEMENT_TYPE_ICONS } from "./shared";
import { ElementDetailSettings } from "./ElementDetailSettings";

export interface ElementSettingsRowProps {
	element: TemplateElement;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onToggleEnabled: () => void;
	onUpdateSettings: (settings: Record<string, unknown>) => void;
	organizationId: string;
	t: ReturnType<typeof useTranslations>;
}

export function ElementSettingsRow({
	element,
	isExpanded,
	onToggleExpand,
	onToggleEnabled,
	onUpdateSettings,
	organizationId,
	t,
}: ElementSettingsRowProps) {
	const typeKey = ELEMENT_TYPE_ICONS[element.type] ?? element.type;

	return (
		<div className="border rounded-xl overflow-hidden bg-background">
			{/* Row Header */}
			<div className="flex items-center gap-2 px-3 py-2">
				<button
					type="button"
					onClick={onToggleExpand}
					className="flex-1 flex items-center gap-2 text-start text-sm"
				>
					<ChevronDownIcon
						className={`h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 ${
							isExpanded ? "rotate-180" : ""
						}`}
					/>
					<span
						className={
							element.enabled
								? "font-medium"
								: "text-muted-foreground line-through"
						}
					>
						{t(`finance.templates.editor.elementTypes.${typeKey}`)}
					</span>
				</button>
				<Switch
					checked={element.enabled}
					onCheckedChange={onToggleEnabled}
					className="scale-75"
				/>
			</div>

			{/* Expanded Settings */}
			{isExpanded && element.enabled && (
				<div className="border-t px-3 py-3 space-y-3 bg-muted/20">
					<ElementDetailSettings
						element={element}
						onUpdate={onUpdateSettings}
						organizationId={organizationId}
						t={t}
					/>
				</div>
			)}
		</div>
	);
}

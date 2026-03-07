"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Star, Trash2, Edit3, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SYSTEM_TEMPLATES } from "../../../lib/specs/system-templates";
import type { SpecificationTemplate } from "../../../lib/specs/spec-types";

interface TemplateManagerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	customTemplates: SpecificationTemplate[];
	onDelete: (id: string) => void;
	onSetDefault: (id: string) => void;
	onRename: (id: string, name: string) => void;
}

export function TemplateManager({
	open,
	onOpenChange,
	customTemplates,
	onDelete,
	onSetDefault,
	onRename,
}: TemplateManagerProps) {
	const t = useTranslations("pricing.studies.finishing.bulk");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");

	const systemTemplates = SYSTEM_TEMPLATES.map((tmpl, i) => ({
		id: `system_${i}`,
		name: tmpl.name,
		description: tmpl.description,
		isSystem: true,
		isDefault: tmpl.isDefault,
		specCount: tmpl.specs.length,
	}));

	const customList = customTemplates.map((tmpl) => ({
		id: tmpl.id,
		name: tmpl.name,
		description: tmpl.description,
		isSystem: false,
		isDefault: tmpl.isDefault,
		specCount: tmpl.specs.length,
	}));

	const allTemplates = [...systemTemplates, ...customList];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="text-lg">{t("manageTemplates")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
					{allTemplates.map((tmpl) => (
						<div
							key={tmpl.id}
							className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/10 transition-colors duration-200"
						>
							<div className="flex-1 min-w-0">
								{editingId === tmpl.id ? (
									<div className="flex items-center gap-2">
										<input
											type="text"
											value={editName}
											onChange={(e) =>
												setEditName(e.target.value)
											}
											className="flex-1 h-8 text-sm rounded-lg border px-3 bg-background"
											autoFocus
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													onRename(
														tmpl.id,
														editName,
													);
													setEditingId(null);
												}
												if (e.key === "Escape") {
													setEditingId(null);
												}
											}}
										/>
										<Button
											size="sm"
											className="h-8 text-sm"
											onClick={() => {
												onRename(
													tmpl.id,
													editName,
												);
												setEditingId(null);
											}}
										>
											{t("save")}
										</Button>
									</div>
								) : (
									<>
										<div className="flex items-center gap-2">
											<span className="font-semibold text-sm">
												{tmpl.name}
											</span>
											{tmpl.isSystem && (
												<Badge
													variant="secondary"
													className="text-xs h-5 px-1.5 rounded-full"
												>
													<Shield className="h-3 w-3 me-0.5" />
													{t("system")}
												</Badge>
											)}
											{tmpl.isDefault && (
												<Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
											)}
										</div>
										{tmpl.description && (
											<p className="text-sm text-muted-foreground mt-0.5 truncate">
												{tmpl.description}
											</p>
										)}
										<p className="text-xs text-muted-foreground mt-0.5">
											{t("specCount", {
												count: tmpl.specCount,
											})}
										</p>
									</>
								)}
							</div>

							{/* Actions */}
							<div className="flex items-center gap-1 shrink-0">
								{!tmpl.isSystem && !tmpl.isDefault && (
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0"
										title={t("setAsDefault")}
										onClick={() =>
											onSetDefault(tmpl.id)
										}
									>
										<Star className="h-4 w-4" />
									</Button>
								)}
								{!tmpl.isSystem &&
									editingId !== tmpl.id && (
										<Button
											variant="ghost"
											size="sm"
											className="h-8 w-8 p-0"
											onClick={() => {
												setEditingId(tmpl.id);
												setEditName(tmpl.name);
											}}
										>
											<Edit3 className="h-4 w-4" />
										</Button>
									)}
								{!tmpl.isSystem && (
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 text-destructive hover:text-destructive"
										onClick={() =>
											onDelete(tmpl.id)
										}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					))}

					{allTemplates.length === 0 && (
						<div className="text-center text-sm text-muted-foreground py-10">
							{t("noTemplates")}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

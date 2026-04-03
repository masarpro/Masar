"use client";

import { useTranslations } from "next-intl";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Button } from "@ui/components/button";
import { Plus, Trash2 } from "lucide-react";

export interface ContentBlock {
	id: string;
	title: string;
	content: string;
	position: "BEFORE_TABLE" | "AFTER_TABLE";
}

interface QuotationContentBlockEditorProps {
	blocks: ContentBlock[];
	position: "BEFORE_TABLE" | "AFTER_TABLE";
	onChange: (blocks: ContentBlock[]) => void;
	disabled?: boolean;
}

export function QuotationContentBlockEditor({
	blocks,
	position,
	onChange,
	disabled,
}: QuotationContentBlockEditorProps) {
	const t = useTranslations("pricing.quotations");

	const filtered = blocks.filter((b) => b.position === position);

	const handleAdd = () => {
		onChange([
			...blocks,
			{
				id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
				title: "",
				content: "",
				position,
			},
		]);
	};

	const handleRemove = (blockId: string) => {
		onChange(blocks.filter((b) => b.id !== blockId));
	};

	const handleUpdate = (blockId: string, field: "title" | "content", value: string) => {
		onChange(blocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b)));
	};

	return (
		<div className="space-y-3">
			{filtered.map((block) => (
				<div
					key={block.id}
					className="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 p-4 space-y-3"
				>
					<div className="flex items-center gap-2">
						<Input
							value={block.title}
							onChange={(e: any) => handleUpdate(block.id, "title", e.target.value)}
							placeholder={t("blockTitlePlaceholder")}
							disabled={disabled}
							className="font-semibold text-base border-0 border-b border-slate-200 dark:border-slate-700/50 focus-visible:ring-0 rounded-none px-0 bg-transparent"
							maxLength={200}
						/>
						{!disabled && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
								onClick={() => handleRemove(block.id)}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
					<Textarea
						value={block.content}
						onChange={(e: any) => handleUpdate(block.id, "content", e.target.value)}
						placeholder={t("blockContentPlaceholder")}
						disabled={disabled}
						className="min-h-[80px] resize-none border-0 focus-visible:ring-0 px-0 bg-transparent text-sm"
						maxLength={5000}
					/>
				</div>
			))}

			{!disabled && (
				<button
					type="button"
					onClick={handleAdd}
					className="w-full py-3 rounded-xl border-2 border-dashed border-primary/25 bg-gradient-to-br from-primary/[0.02] to-primary/[0.06] hover:from-primary/[0.04] hover:to-primary/[0.10] hover:border-primary/40 text-primary text-sm font-semibold flex items-center justify-center gap-2 transition-all"
				>
					<Plus className="h-[18px] w-[18px]" />
					{t("addContentBlock")}
				</button>
			)}
		</div>
	);
}

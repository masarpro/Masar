"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { FileText, Package, Plus } from "lucide-react";

interface Props {
	onAddItem: () => void;
	onApplyPreset: () => void;
}

export function EmptyState({ onAddItem, onApplyPreset }: Props) {
	return (
		<Card className="flex flex-col items-center gap-4 p-12 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<FileText className="h-8 w-8 text-muted-foreground" />
			</div>

			<div>
				<h3 className="text-lg font-semibold">لا توجد بنود بعد</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					أضف بنوداً من الكتالوج للبدء
				</p>
			</div>

			<div className="flex flex-col items-center gap-2">
				<Button size="lg" onClick={onApplyPreset}>
					<Package className="me-2 h-4 w-4" />
					تطبيق باقة جاهزة
				</Button>
				<Button variant="ghost" size="sm" onClick={onAddItem}>
					<Plus className="me-1.5 h-3.5 w-3.5" />
					إضافة بند يدوي
				</Button>
			</div>
		</Card>
	);
}

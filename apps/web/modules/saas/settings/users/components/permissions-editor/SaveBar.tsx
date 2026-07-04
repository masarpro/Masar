"use client";

import { Button } from "@ui/components/button";
import { RotateCcwIcon, Undo2Icon } from "lucide-react";

/**
 * شريط الحفظ أسفل محرر الصلاحيات: حفظ + تراجع عن التعديلات +
 * إعادة للدور الافتراضي (مسح التخصيصات).
 */
export function SaveBar({
	dirty,
	customized,
	saving,
	onSave,
	onRevert,
	onResetToRole,
}: {
	/** توجد تعديلات غير محفوظة */
	dirty: boolean;
	/** المصفوفة الحالية تخالف صلاحيات الدور (تخصيصات) */
	customized: boolean;
	saving: boolean;
	onSave: () => void;
	onRevert: () => void;
	onResetToRole: () => void;
}) {
	return (
		<div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border/60 bg-background/95 px-1 pt-3 backdrop-blur">
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onResetToRole}
					disabled={saving || !customized}
					title="مسح التخصيصات والعودة لصلاحيات الدور"
				>
					<RotateCcwIcon className="me-1.5 size-4" />
					إعادة للدور الافتراضي
				</Button>
				{dirty && (
					<span className="text-muted-foreground text-xs">
						تغييرات غير محفوظة
					</span>
				)}
			</div>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onRevert}
					disabled={saving || !dirty}
				>
					<Undo2Icon className="me-1.5 size-4" />
					تراجع
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={onSave}
					disabled={saving || !dirty}
				>
					{saving ? "جارٍ الحفظ..." : "حفظ الصلاحيات"}
				</Button>
			</div>
		</div>
	);
}

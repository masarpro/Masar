"use client";

import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { NumericInput } from "../../../shared";
import { foundationBendCodeMinimum } from "../../../../../lib/structural-calculations";

interface BendFieldsProps {
	mode: "none" | "all" | "alternate";
	onModeChange: (m: "none" | "all" | "alternate") => void;
	legLength: number;
	onLegLengthChange: (v: number) => void;
	/** عمق القاعدة (م) */
	thickness: number;
	coverBottom: number;
	coverTop: number;
	/** أكبر قطر مستخدم في الشبكة (مم) — للتحقق من الحد الأدنى الكودي */
	maxBarDiameter: number;
}

/**
 * ثني أطراف شبكة القاعدة (الرجل).
 *
 * الرجل تصعد على وجه القاعدة الجانبي، فأقصى طول هندسي ممكن هو
 * عمق القاعدة ناقص الغطاء السفلي والعلوي. والحد الأدنى كودياً
 * (SBC 304 / ACI 318) هو 12 مرة قطر السيخ، ولا يقل عملياً عن 30 سم.
 */
export function BendFields({
	mode,
	onModeChange,
	legLength,
	onLegLengthChange,
	thickness,
	coverBottom,
	coverTop,
	maxBarDiameter,
}: BendFieldsProps) {
	const geometricMax = Math.max(0, thickness - coverBottom - coverTop);
	const codeMin = foundationBendCodeMinimum(maxBarDiameter);
	const effective = legLength > 0 ? Math.min(legLength, geometricMax) : geometricMax;
	const belowCode = effective > 0 && effective < codeMin;

	return (
		<div className="space-y-3 border-t pt-4">
			<div className="flex items-center gap-2">
				<span className="w-2 h-2 rounded-full bg-chart-4" />
				<h5 className="text-sm font-medium">ثني أطراف الشبكة (الرجل)</h5>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div className="space-y-1">
					<Label className="text-xs">وضع الثني</Label>
					<Select value={mode} onValueChange={(v: any) => onModeChange(v)}>
						<SelectTrigger className="h-9 text-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">بدون ثني — خطاف قصير فقط</SelectItem>
							<SelectItem value="all">رجل على كل سيخ</SelectItem>
							<SelectItem value="alternate">رجل بالتبادل — سيخ وسيخ</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{mode !== "none" && (
					<div className="space-y-1">
						<Label className="text-xs">
							طول الرجل (م) — اتركه 0 للحساب التلقائي
						</Label>
						<NumericInput
							min={0}
							max={geometricMax}
							fallback={0}
							value={legLength}
							onValueChange={onLegLengthChange}
							className="h-9 text-sm"
						/>
					</div>
				)}
			</div>

			{mode !== "none" && (
				<div className="rounded-lg bg-muted/40 p-2.5 text-xs space-y-1">
					<p>
						الرجل المطبَّقة:{" "}
						<span className="font-semibold text-foreground">
							{effective.toFixed(2)} م
						</span>{" "}
						<span className="text-muted-foreground">
							(الأقصى الهندسي {geometricMax.toFixed(2)} م = العمق −
							الغطاءين)
						</span>
					</p>
					<p className="text-muted-foreground">
						الحد الأدنى الكودي لقطر Ø{maxBarDiameter}: {codeMin.toFixed(2)} م
						— SBC 304 / ACI 318 (12 مرة القطر، ولا تقل عن 30 سم)
					</p>
					{belowCode && (
						<p className="text-destructive font-medium">
							⚠ الرجل أقل من الحد الأدنى الكودي — راجع عمق القاعدة أو قطر
							السيخ
						</p>
					)}
					<p className="text-muted-foreground">
						الرجل تحلّ محل الخطاف ولا تُضاف إليه؛ طول السيخ المقطوع = البعد
						الصافي + ضعف الرجل، وهذا يغيّر عدد الأسياخ المشتراة من السيخ
						القياسي 12 م.
					</p>
				</div>
			)}
		</div>
	);
}

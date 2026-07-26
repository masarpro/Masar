"use client";

import { Input } from "@ui/components/input";
import { useEffect, useState } from "react";

interface NumericInputProps {
	value: number;
	onValueChange: (value: number) => void;
	min?: number;
	max?: number;
	/** القيمة المستخدمة عند ترك الحقل فارغاً (افتراضياً min أو 0) */
	fallback?: number;
	className?: string;
	disabled?: boolean;
	id?: string;
	placeholder?: string;
}

/**
 * حقل رقمي يسمح بكتابة الأرقام العشرية بشكل طبيعي.
 *
 * لماذا ليس `<input type="number">`؟
 * المتصفح يُرجع `value === ""` للقيم الجزئية مثل "10." أثناء الكتابة، فإذا كان
 * الحقل مربوطاً بـ state ويُعاد ضبطه من `parseFloat(value) || fallback` فإن
 * النقطة العشرية تُحذف فور كتابتها ويستحيل إدخال 10.5 — لذلك نستخدم
 * `type="text"` مع `inputMode="decimal"` ونحتفظ بالنص الخام محلياً أثناء
 * التركيز، ونُطبّق الحدود (min/max) عند مغادرة الحقل فقط.
 */
export function NumericInput({
	value,
	onValueChange,
	min,
	max,
	fallback,
	className,
	disabled,
	id,
	placeholder,
}: NumericInputProps) {
	const toDisplay = (v: number) =>
		v === undefined || v === null || Number.isNaN(v) ? "" : String(v);

	const [draft, setDraft] = useState<string>(() => toDisplay(value));
	const [isFocused, setIsFocused] = useState(false);

	// نُزامن القيمة القادمة من الأعلى فقط عندما لا يكون المستخدم يكتب
	useEffect(() => {
		if (!isFocused) {
			setDraft(toDisplay(value));
		}
	}, [value, isFocused]);

	const clamp = (n: number) => {
		let next = n;
		if (min !== undefined) next = Math.max(min, next);
		if (max !== undefined) next = Math.min(max, next);
		return next;
	};

	return (
		<Input
			id={id}
			type="text"
			inputMode="decimal"
			dir="ltr"
			disabled={disabled}
			className={className}
			placeholder={placeholder}
			value={draft}
			onFocus={() => setIsFocused(true)}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
				const raw = e.target.value;
				// نسمح بالفراغ، والإشارة، والنقطة/الفاصلة العشرية أثناء الكتابة
				if (raw !== "" && !/^-?\d*[.,]?\d*$/.test(raw)) return;
				const normalized = raw.replace(",", ".");
				setDraft(normalized);
				const parsed = Number.parseFloat(normalized);
				// تحديث حيّ بدون قصّ — القصّ يتم عند مغادرة الحقل
				if (!Number.isNaN(parsed)) {
					onValueChange(parsed);
				}
			}}
			onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
				setIsFocused(false);
				const parsed = Number.parseFloat(e.target.value);
				const next = Number.isNaN(parsed)
					? (fallback ?? min ?? 0)
					: clamp(parsed);
				setDraft(toDisplay(next));
				onValueChange(next);
			}}
		/>
	);
}

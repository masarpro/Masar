"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScaleToFitProps {
	children: ReactNode;
	/** العرض الطبيعي للمحتوى بالبكسل — A4 عمودي ≈ 794px (210mm @ 96dpi) */
	contentWidth?: number;
	className?: string;
}

/**
 * يصغّر مستند A4 ليطابق عرض الشاشة على الجوال (transform: scale) بدل قصّه.
 * على الشاشات الأعرض من المحتوى لا يفعل شيئاً، وعند الطباعة يُلغى التصغير
 * كلياً عبر كلاسات print حتى تخرج الصفحة بمقاسها الحقيقي.
 */
export function ScaleToFit({
	children,
	contentWidth = 794,
	className,
}: ScaleToFitProps) {
	const outerRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);
	const [scaledHeight, setScaledHeight] = useState<number | undefined>();

	useEffect(() => {
		const measure = () => {
			const available = outerRef.current?.clientWidth ?? contentWidth;
			const s = Math.min(1, available / contentWidth);
			setScale(s);
			const h = innerRef.current?.offsetHeight;
			// عند التصغير: الحاوية تحجز الارتفاع المُصغَّر فقط (transform لا يؤثر
			// على الـ layout فبدونه يبقى فراغ ضخم أسفل المستند)
			setScaledHeight(s < 1 && h ? h * s : undefined);
		};
		measure();
		const ro = new ResizeObserver(measure);
		if (outerRef.current) ro.observe(outerRef.current);
		if (innerRef.current) ro.observe(innerRef.current);
		return () => ro.disconnect();
	}, [contentWidth]);

	return (
		<div
			ref={outerRef}
			className={`${className ?? ""} print:!h-auto`}
			style={{ height: scaledHeight }}
		>
			<div
				ref={innerRef}
				className="print:!w-auto print:!transform-none"
				style={
					scale < 1
						? {
								width: contentWidth,
								transform: `scale(${scale})`,
								transformOrigin: "top right",
							}
						: undefined
				}
			>
				{children}
			</div>
		</div>
	);
}

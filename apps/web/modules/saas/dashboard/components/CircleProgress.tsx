"use client";

import { useEffect, useState } from "react";

interface CircleProgressProps {
	percentage: number;
	size?: number;
	strokeWidth?: number;
	color?: string;
	className?: string;
}

export function CircleProgress({
	percentage,
	size = 40,
	strokeWidth = 3.5,
	color = "#0ea5e9",
	className,
}: CircleProgressProps) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const [animatedOffset, setAnimatedOffset] = useState(circumference);

	useEffect(() => {
		const timer = setTimeout(() => {
			setAnimatedOffset(
				circumference - (percentage / 100) * circumference,
			);
		}, 100);
		return () => clearTimeout(timer);
	}, [percentage, circumference]);

	return (
		<div
			className={`relative shrink-0 ${className ?? ""}`}
			style={{ width: size, height: size }}
		>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
			>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={strokeWidth}
					className="text-gray-100 dark:text-gray-800"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={color}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={animatedOffset}
					transform={`rotate(-90 ${size / 2} ${size / 2})`}
					style={{ transition: "stroke-dashoffset 1.4s ease-out" }}
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				<span
					className="text-[9px] font-bold"
					style={{ color }}
				>
					{percentage}%
				</span>
			</div>
		</div>
	);
}

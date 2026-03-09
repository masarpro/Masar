"use client";

import { Input } from "@ui/components/input";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatCurrency, formatNumber } from "../../lib/utils";

interface PricingItemRowProps {
	name: string;
	quantity: number;
	unit: string;
	materialPrice: number;
	laborPrice: number;
	wastagePercent?: number;
	totalCost: number;
	showWastage?: boolean;
	extraInfo?: string;
	onPriceChange: (prices: {
		materialPrice: number;
		laborPrice: number;
		wastagePercent?: number;
	}) => void;
}

export function PricingItemRow({
	name,
	quantity,
	unit,
	materialPrice,
	laborPrice,
	wastagePercent = 0,
	totalCost,
	showWastage = false,
	extraInfo,
	onPriceChange,
}: PricingItemRowProps) {
	const [matPrice, setMatPrice] = useState(String(materialPrice));
	const [labPrice, setLabPrice] = useState(String(laborPrice));
	const [wastage, setWastage] = useState(String(wastagePercent));
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Sync with external changes
	useEffect(() => {
		setMatPrice(String(materialPrice));
	}, [materialPrice]);

	useEffect(() => {
		setLabPrice(String(laborPrice));
	}, [laborPrice]);

	useEffect(() => {
		setWastage(String(wastagePercent));
	}, [wastagePercent]);

	const debouncedSave = useCallback(
		(mp: string, lp: string, wp: string) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				const mpVal = parseFloat(mp);
				const lpVal = parseFloat(lp);
				const wpVal = parseFloat(wp);
				onPriceChange({
					materialPrice: Number.isNaN(mpVal) ? 0 : mpVal,
					laborPrice: Number.isNaN(lpVal) ? 0 : lpVal,
					...(showWastage
						? {
								wastagePercent: Number.isNaN(wpVal)
									? 0
									: wpVal,
							}
						: {}),
				});
			}, 500);
		},
		[onPriceChange, showWastage],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const handleMatChange = (val: string) => {
		setMatPrice(val);
		debouncedSave(val, labPrice, wastage);
	};

	const handleLabChange = (val: string) => {
		setLabPrice(val);
		debouncedSave(matPrice, val, wastage);
	};

	const handleWastageChange = (val: string) => {
		setWastage(val);
		debouncedSave(matPrice, labPrice, val);
	};

	return (
		<div className="grid grid-cols-[1fr_70px_50px_90px_90px_100px] sm:grid-cols-[1fr_80px_55px_100px_100px_60px_110px] items-center gap-1.5 px-3 py-2 rounded-lg border bg-card text-sm hover:bg-accent/30 transition-colors">
			{/* Name */}
			<div className="min-w-0">
				<span className="truncate block">{name}</span>
				{extraInfo && (
					<span className="text-xs text-muted-foreground truncate block">
						{extraInfo}
					</span>
				)}
			</div>

			{/* Quantity */}
			<span className="text-left tabular-nums text-muted-foreground" dir="ltr">
				{formatNumber(quantity, 2)}
			</span>

			{/* Unit */}
			<span className="text-xs text-muted-foreground">{unit}</span>

			{/* Material Price */}
			<Input
				type="number"
				value={matPrice}
				onChange={(e) => handleMatChange(e.target.value)}
				className="h-7 text-xs tabular-nums px-1.5"
				dir="ltr"
				min={0}
			/>

			{/* Labor Price */}
			<Input
				type="number"
				value={labPrice}
				onChange={(e) => handleLabChange(e.target.value)}
				className="h-7 text-xs tabular-nums px-1.5"
				dir="ltr"
				min={0}
			/>

			{/* Wastage (optional, hidden on mobile if showWastage) */}
			{showWastage ? (
				<Input
					type="number"
					value={wastage}
					onChange={(e) => handleWastageChange(e.target.value)}
					className="h-7 text-xs tabular-nums px-1.5 hidden sm:block"
					dir="ltr"
					min={0}
					max={100}
				/>
			) : (
				<span className="hidden sm:block" />
			)}

			{/* Total Cost */}
			<span className="text-left font-semibold tabular-nums text-sm" dir="ltr">
				{formatCurrency(totalCost)}
			</span>
		</div>
	);
}

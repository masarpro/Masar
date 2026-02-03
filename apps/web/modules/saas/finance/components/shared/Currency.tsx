"use client";

import { cn } from "@ui/lib";

interface CurrencyProps {
	amount: number | null | undefined;
	className?: string;
	showSymbol?: boolean;
	symbolClassName?: string;
}

/**
 * Saudi Riyal Symbol component
 * Uses the icon font from saudi-riyal-symbol package
 */
function RiyalSymbol({ className }: { className?: string }) {
	return (
		<i
			className={cn("sr", className)}
			aria-label="ر.س"
		/>
	);
}

/**
 * Currency component that displays amount with Saudi Riyal symbol
 */
export function Currency({
	amount,
	className,
	showSymbol = true,
	symbolClassName,
}: CurrencyProps) {
	const formattedAmount = new Intl.NumberFormat("en-SA", {
		style: "decimal",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount ?? 0);

	return (
		<span className={cn("inline-flex items-center gap-1", className)}>
			<span>{formattedAmount}</span>
			{showSymbol && <RiyalSymbol className={symbolClassName} />}
		</span>
	);
}

/**
 * Shorthand for Currency component with bold symbol
 */
export function CurrencyBold({
	amount,
	className,
	showSymbol = true,
	symbolClassName,
}: CurrencyProps) {
	const formattedAmount = new Intl.NumberFormat("en-SA", {
		style: "decimal",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount ?? 0);

	return (
		<span className={cn("inline-flex items-center gap-1", className)}>
			<span>{formattedAmount}</span>
			{showSymbol && <RiyalSymbol className={symbolClassName} />}
		</span>
	);
}

"use client";

import { useEffect } from "react";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { ConcreteTypeSelect } from "./ConcreteTypeSelect";

interface SubType {
	value: string;
	label: string;
}

interface ElementHeaderRowProps {
	autoNamePrefix: string;
	existingCount: number;
	name: string;
	onNameChange: (name: string) => void;
	subTypes?: SubType[];
	selectedSubType?: string;
	onSubTypeChange?: (type: string) => void;
	quantity: number;
	onQuantityChange: (qty: number) => void;
	concreteType: string;
	onConcreteTypeChange: (type: string) => void;
	customConcreteType?: string;
	onCustomConcreteTypeChange?: (type: string) => void;
	showQuantity?: boolean;
	showConcreteType?: boolean;
	showSubType?: boolean;
	className?: string;
}

export function ElementHeaderRow({
	autoNamePrefix,
	existingCount,
	name,
	onNameChange,
	subTypes,
	selectedSubType,
	onSubTypeChange,
	quantity,
	onQuantityChange,
	concreteType,
	onConcreteTypeChange,
	customConcreteType,
	onCustomConcreteTypeChange,
	showQuantity = true,
	showConcreteType = true,
	showSubType = true,
	className,
}: ElementHeaderRowProps) {
	// Auto-generate name if empty
	useEffect(() => {
		if (!name) {
			const autoName = `${autoNamePrefix}${existingCount + 1}`;
			onNameChange(autoName);
		}
	}, [name, autoNamePrefix, existingCount, onNameChange]);

	return (
		<div
			className={`flex flex-wrap items-center gap-3 bg-muted/30 rounded-lg p-3 border ${className || ""}`}
		>
			{/* Element Name */}
			<div className="flex-shrink-0 w-24">
				<Input
					value={name}
					onChange={(e) => onNameChange(e.target.value)}
					className="text-center font-bold"
					placeholder={`${autoNamePrefix}1`}
				/>
			</div>

			{/* Subtype Dropdown */}
			{showSubType && subTypes && subTypes.length > 0 && onSubTypeChange && (
				<div className="flex-1 min-w-[150px] max-w-[200px]">
					<Select value={selectedSubType} onValueChange={onSubTypeChange}>
						<SelectTrigger>
							<SelectValue placeholder="نوع العنصر" />
						</SelectTrigger>
						<SelectContent>
							{subTypes.map((t) => (
								<SelectItem key={t.value} value={t.value}>
									{t.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}

			{/* Quantity */}
			{showQuantity && (
				<div className="flex-shrink-0 w-20">
					<Input
						type="number"
						min={1}
						value={quantity}
						onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
						placeholder="العدد"
						className="text-center"
					/>
				</div>
			)}

			{/* Concrete Type */}
			{showConcreteType && (
				<div className="flex-shrink-0 w-28">
					<ConcreteTypeSelect
						value={concreteType}
						onChange={onConcreteTypeChange}
						customValue={customConcreteType}
						onCustomValueChange={onCustomConcreteTypeChange}
						compact
					/>
				</div>
			)}
		</div>
	);
}

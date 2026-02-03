"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Input } from "@ui/components/input";
import { CONCRETE_TYPES } from "../../constants/prices";

interface ConcreteTypeSelectProps {
	value: string;
	onChange: (value: string) => void;
	customValue?: string;
	onCustomValueChange?: (value: string) => void;
	compact?: boolean;
	className?: string;
}

export function ConcreteTypeSelect({
	value,
	onChange,
	customValue,
	onCustomValueChange,
	compact = false,
	className,
}: ConcreteTypeSelectProps) {
	const isCustom = value === "custom";

	return (
		<div className={compact ? "flex items-center gap-2" : "space-y-2"}>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className={className}>
					<SelectValue placeholder="نوع الخرسانة" />
				</SelectTrigger>
				<SelectContent>
					{CONCRETE_TYPES.map((type) => (
						<SelectItem key={type} value={type}>
							{type}
						</SelectItem>
					))}
					<SelectItem value="custom">مخصص</SelectItem>
				</SelectContent>
			</Select>
			{isCustom && onCustomValueChange && (
				<Input
					value={customValue || ""}
					onChange={(e) => onCustomValueChange(e.target.value)}
					placeholder="مثال: C45"
					className={compact ? "w-24" : ""}
				/>
			)}
		</div>
	);
}

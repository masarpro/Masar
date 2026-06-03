"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
	UNIT_KEYS,
	UNIT_VALUES,
	PREDEFINED_UNIT_VALUES,
} from "@saas/shared/lib/invoice-constants";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Button } from "@ui/components/button";
import { X } from "lucide-react";

interface UnitFieldProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

const CUSTOM_SENTINEL = "_custom";
const EMPTY_SENTINEL = "_empty";

export function UnitField({ value, onChange, disabled }: UnitFieldProps) {
	const t = useTranslations();

	const isCustomValue = !!value && !PREDEFINED_UNIT_VALUES.includes(value);
	const [isCustomMode, setIsCustomMode] = useState(isCustomValue);

	if (isCustomMode) {
		return (
			<div className="flex items-center gap-1">
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={t("finance.items.unitCustomPlaceholder")}
					disabled={disabled}
					maxLength={20}
					className="rounded-[10px] h-9 text-xs text-center border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08]"
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
					onClick={() => {
						setIsCustomMode(false);
						onChange("");
					}}
					disabled={disabled}
					aria-label={t("common.clear")}
				>
					<X className="h-3 w-3" />
				</Button>
			</div>
		);
	}

	return (
		<Select
			value={value || EMPTY_SENTINEL}
			onValueChange={(v) => {
				if (v === CUSTOM_SENTINEL) {
					setIsCustomMode(true);
					onChange("");
					return;
				}
				onChange(v === EMPTY_SENTINEL ? "" : v);
			}}
			disabled={disabled}
		>
			<SelectTrigger className="rounded-[10px] h-9 text-xs px-1 border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30">
				<SelectValue placeholder={t("finance.items.unitPlaceholder")} />
			</SelectTrigger>
			<SelectContent className="rounded-xl">
				<SelectItem value={EMPTY_SENTINEL}>-</SelectItem>
				{UNIT_KEYS.map((key) => (
					<SelectItem key={key} value={UNIT_VALUES[key]}>
						{t(`finance.units.${key}`)}
					</SelectItem>
				))}
				<SelectItem value={CUSTOM_SENTINEL} className="font-medium text-primary">
					{t("finance.items.unitCustom")}
				</SelectItem>
			</SelectContent>
		</Select>
	);
}

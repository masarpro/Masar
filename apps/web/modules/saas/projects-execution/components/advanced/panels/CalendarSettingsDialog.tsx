"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface HolidayEntry {
	name: string;
	from: string;
	to: string;
}

interface CalendarSettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialWorkDays?: number[];
	initialHoursPerDay?: number;
	initialHolidays?: HolidayEntry[];
	onSave: (workDays: number[], hoursPerDay: number, holidays?: HolidayEntry[]) => void;
	isLoading?: boolean;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export function CalendarSettingsDialog({
	open,
	onOpenChange,
	initialWorkDays = [0, 1, 2, 3, 4], // Sun-Thu (Saudi work week)
	initialHoursPerDay = 8,
	initialHolidays = [],
	onSave,
	isLoading,
}: CalendarSettingsDialogProps) {
	const t = useTranslations();
	const [workDays, setWorkDays] = useState<number[]>(initialWorkDays);
	const [hoursPerDay, setHoursPerDay] = useState(initialHoursPerDay);
	const [holidays, setHolidays] = useState<HolidayEntry[]>(initialHolidays);

	useEffect(() => {
		if (open) {
			setWorkDays(initialWorkDays);
			setHoursPerDay(initialHoursPerDay);
			setHolidays(initialHolidays);
		}
	}, [open, initialWorkDays, initialHoursPerDay, initialHolidays]);

	const toggleDay = (day: number) => {
		setWorkDays((prev) =>
			prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
		);
	};

	const addHoliday = () => {
		setHolidays((prev) => [...prev, { name: "", from: "", to: "" }]);
	};

	const updateHoliday = (index: number, field: keyof HolidayEntry, value: string) => {
		setHolidays((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [field]: value };
			return next;
		});
	};

	const removeHoliday = (index: number) => {
		setHolidays((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{t("execution.advanced.calendar.title")}
					</DialogTitle>
					<DialogDescription>
						{t("execution.advanced.calendar.description")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Work days */}
					<div className="space-y-3">
						<Label>
							{t("execution.advanced.calendar.workDays")}
						</Label>
						<div className="grid grid-cols-4 gap-2">
							{DAYS.map((day) => (
								<label
									key={day}
									className="flex items-center gap-2 text-sm cursor-pointer"
								>
									<Checkbox
										checked={workDays.includes(day)}
										onCheckedChange={() => toggleDay(day)}
									/>
									{t(`execution.calendar.days.${day}`)}
								</label>
							))}
						</div>
					</div>

					{/* Hours per day */}
					<div className="space-y-2">
						<Label>
							{t("execution.advanced.calendar.hoursPerDay")}
						</Label>
						<Input
							type="number"
							min={1}
							max={24}
							value={hoursPerDay}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								setHoursPerDay(Math.max(1, Math.min(24, Number(e.target.value))))
							}
							className="w-24"
						/>
					</div>

					{/* Holidays */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label>
								{t("execution.advanced.calendar.holidays")}
							</Label>
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs gap-1"
								onClick={addHoliday}
							>
								<PlusIcon className="h-3 w-3" />
								{t("execution.advanced.calendar.addHoliday")}
							</Button>
						</div>

						{holidays.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								{t("execution.advanced.calendar.noHolidays")}
							</p>
						) : (
							<div className="space-y-2">
								{holidays.map((holiday, idx) => (
									<div
										key={idx}
										className="flex items-end gap-2 rounded-md border p-2"
									>
										<div className="flex-1 space-y-1">
											<Label className="text-xs">
												{t("execution.advanced.calendar.holidayName")}
											</Label>
											<Input
												value={holiday.name}
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													updateHoliday(idx, "name", e.target.value)
												}
												placeholder={t(
													"execution.advanced.calendar.holidayNamePlaceholder",
												)}
												className="h-8 text-sm"
											/>
										</div>
										<div className="w-[120px] space-y-1">
											<Label className="text-xs">
												{t("execution.advanced.calendar.holidayFrom")}
											</Label>
											<Input
												type="date"
												value={holiday.from}
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													updateHoliday(idx, "from", e.target.value)
												}
												className="h-8 text-sm"
											/>
										</div>
										<div className="w-[120px] space-y-1">
											<Label className="text-xs">
												{t("execution.advanced.calendar.holidayTo")}
											</Label>
											<Input
												type="date"
												value={holiday.to}
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													updateHoliday(idx, "to", e.target.value)
												}
												className="h-8 text-sm"
											/>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 shrink-0 text-destructive"
											onClick={() => removeHoliday(idx)}
										>
											<TrashIcon className="h-3.5 w-3.5" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{t("execution.advanced.calendar.cancel")}
					</Button>
					<Button
						onClick={() => onSave(workDays, hoursPerDay, holidays)}
						disabled={isLoading}
					>
						{t("execution.advanced.calendar.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

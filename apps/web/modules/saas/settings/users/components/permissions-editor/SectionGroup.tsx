"use client";

import type { Permissions } from "@repo/database/prisma/permissions";
import { Button } from "@ui/components/button";
import { Switch } from "@ui/components/switch";
import { ACTION_LABELS_AR, SECTION_LABELS_AR } from "./permission-labels";

/**
 * قسم واحد في مصفوفة الصلاحيات: عنوان + تحديد/إلغاء الكل + مفاتيح
 * الإجراءات. الإجراء المخالف لصلاحيات الدور يُعلَّم بشارة "مخصص".
 */
export function SectionGroup({
	section,
	values,
	baseValues,
	onChange,
}: {
	section: keyof Permissions;
	values: Record<string, boolean>;
	baseValues: Record<string, boolean>;
	onChange: (action: string, value: boolean) => void;
}) {
	const actionLabels = ACTION_LABELS_AR[section];
	const actions = Object.keys(actionLabels);
	const enabledCount = actions.filter((action) => values[action]).length;
	const allEnabled = enabledCount === actions.length;

	const setAll = (value: boolean) => {
		for (const action of actions) {
			onChange(action, value);
		}
	};

	return (
		<div className="rounded-xl border-2 bg-card">
			<div className="flex items-center justify-between border-b border-border px-4 py-2.5">
				<div className="flex items-center gap-2">
					<h4 className="font-semibold text-sm">
						{SECTION_LABELS_AR[section]}
					</h4>
					<span className="text-muted-foreground text-xs">
						{enabledCount}/{actions.length}
					</span>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-7 text-xs"
					onClick={() => setAll(!allEnabled)}
				>
					{allEnabled ? "إلغاء الكل" : "تحديد الكل"}
				</Button>
			</div>
			<div className="grid grid-cols-1 gap-x-6 gap-y-1 p-3 sm:grid-cols-2">
				{actions.map((action) => {
					const isCustomized =
						(values[action] ?? false) !==
						(baseValues[action] ?? false);
					const switchId = `perm-${section}-${action}`;
					return (
						<label
							key={action}
							htmlFor={switchId}
							className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50"
						>
							<span className="flex items-center gap-2 text-sm">
								{actionLabels[action]}
								{isCustomized && (
									<span
										className="inline-flex items-center rounded-full bg-chart-1/15 px-1.5 py-0.5 text-[10px] text-chart-1"
										title="مخصص — يختلف عن صلاحيات الدور"
									>
										مخصص
									</span>
								)}
							</span>
							<Switch
								id={switchId}
								checked={values[action] ?? false}
								onCheckedChange={(checked) =>
									onChange(action, checked === true)
								}
							/>
						</label>
					);
				})}
			</div>
		</div>
	);
}

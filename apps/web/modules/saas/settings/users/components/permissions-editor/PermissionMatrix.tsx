"use client";

import type { Permissions } from "@repo/database/prisma/permissions";
import { SECTION_ORDER } from "./permission-labels";
import { SectionGroup } from "./SectionGroup";

/**
 * مصفوفة الصلاحيات الكاملة: 8 أقسام × إجراءاتها (49 صلاحية).
 * `base` هي صلاحيات الدور المختار — تُستخدم لتمييز التخصيصات بصرياً.
 */
export function PermissionMatrix({
	values,
	base,
	onChange,
}: {
	values: Permissions;
	base: Permissions;
	onChange: (
		section: keyof Permissions,
		action: string,
		value: boolean,
	) => void;
}) {
	return (
		<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
			{SECTION_ORDER.map((section) => (
				<SectionGroup
					key={section}
					section={section}
					values={
						values[section] as unknown as Record<string, boolean>
					}
					baseValues={
						base[section] as unknown as Record<string, boolean>
					}
					onChange={(action, value) =>
						onChange(section, action, value)
					}
				/>
			))}
		</div>
	);
}

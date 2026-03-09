import { db } from "@repo/database";
import type { EmployeeChangeType } from "@repo/database/prisma/generated";

type EmployeeData = {
	name?: string | null;
	type?: string | null;
	status?: string | null;
	phone?: string | null;
	email?: string | null;
	nationalId?: string | null;
	salaryType?: string | null;
	baseSalary?: number | string | { toString(): string } | null;
	housingAllowance?: number | string | { toString(): string } | null;
	transportAllowance?: number | string | { toString(): string } | null;
	otherAllowances?: number | string | { toString(): string } | null;
	gosiSubscription?: number | string | { toString(): string } | null;
	joinDate?: Date | string | null;
	endDate?: Date | string | null;
	linkedUserId?: string | null;
	notes?: string | null;
};

type LogEmployeeChangeParams = {
	employeeId: string;
	organizationId: string;
	changedBy: string;
	oldData: EmployeeData;
	newData: EmployeeData;
	notes?: string;
};

// Fields that map to SALARY_CHANGE
const salaryFields = [
	"baseSalary",
	"housingAllowance",
	"transportAllowance",
	"otherAllowances",
	"gosiSubscription",
	"salaryType",
] as const;

// Fields that map to specific change types
const fieldChangeTypeMap: Record<string, EmployeeChangeType> = {
	status: "STATUS_CHANGE",
	type: "POSITION_CHANGE",
};

function toStr(val: unknown): string | null {
	if (val === null || val === undefined) return null;
	if (val instanceof Date) return val.toISOString();
	return String(val);
}

export async function logEmployeeChanges(params: LogEmployeeChangeParams) {
	const { employeeId, organizationId, changedBy, oldData, newData, notes } =
		params;

	const changes: Array<{
		changeType: EmployeeChangeType;
		fieldName: string;
		oldValue: string | null;
		newValue: string | null;
	}> = [];

	// Check salary fields
	for (const field of salaryFields) {
		const oldVal = toStr(oldData[field]);
		const newVal = toStr(newData[field]);
		if (newVal !== undefined && oldVal !== newVal) {
			changes.push({
				changeType: "SALARY_CHANGE",
				fieldName: field,
				oldValue: oldVal,
				newValue: newVal,
			});
		}
	}

	// Check status and type (position)
	for (const [field, changeType] of Object.entries(fieldChangeTypeMap)) {
		const oldVal = toStr(oldData[field as keyof EmployeeData]);
		const newVal = toStr(newData[field as keyof EmployeeData]);
		if (newVal !== undefined && oldVal !== newVal) {
			changes.push({
				changeType,
				fieldName: field,
				oldValue: oldVal,
				newValue: newVal,
			});
		}
	}

	// Check general info fields
	const infoFields = [
		"name",
		"phone",
		"email",
		"nationalId",
		"joinDate",
		"endDate",
		"linkedUserId",
		"notes",
	] as const;

	for (const field of infoFields) {
		const oldVal = toStr(oldData[field]);
		const newVal = toStr(newData[field]);
		if (newVal !== undefined && oldVal !== newVal) {
			changes.push({
				changeType: "INFO_UPDATE",
				fieldName: field,
				oldValue: oldVal,
				newValue: newVal,
			});
		}
	}

	if (changes.length > 0) {
		await db.employeeChangeLog.createMany({
			data: changes.map((change) => ({
				employeeId,
				organizationId,
				changedBy,
				notes,
				...change,
			})),
		});
	}

	return changes.length;
}

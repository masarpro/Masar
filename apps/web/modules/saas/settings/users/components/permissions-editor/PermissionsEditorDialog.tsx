"use client";

import {
	createEmptyPermissions,
	DEFAULT_ROLE_PERMISSIONS,
	type Permissions,
} from "@repo/database/prisma/permissions";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Alert, AlertTitle } from "@ui/components/alert";
import { Badge } from "@ui/components/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PermissionMatrix } from "./PermissionMatrix";
import { SaveBar } from "./SaveBar";
import { SECTION_ORDER } from "./permission-labels";

interface EditableUser {
	id: string;
	name: string | null;
	organizationRoleId?: string | null;
	organizationRole?: {
		id: string;
		name: string;
		type: string | null;
		permissions?: unknown;
	} | null;
	customPermissions?: unknown;
}

interface RoleOption {
	id: string;
	name: string;
	type: string | null;
	permissions?: unknown;
}

/** دمج جزئي فوق صلاحيات فارغة — يضمن اكتمال كل الأقسام والمفاتيح */
function normalizePermissions(partial: unknown): Permissions {
	const empty = createEmptyPermissions();
	if (!partial || typeof partial !== "object") {
		return empty;
	}
	const source = partial as Record<string, Record<string, boolean>>;
	for (const section of SECTION_ORDER) {
		if (source[section] && typeof source[section] === "object") {
			(empty[section] as unknown as Record<string, boolean>) = {
				...(empty[section] as unknown as Record<string, boolean>),
				...source[section],
			};
		}
	}
	return empty;
}

/** صلاحيات الدور الأساسية (المخزّنة فوق افتراضيات نوع الدور) */
function resolveRoleBase(role: RoleOption | undefined): Permissions {
	if (!role) {
		return createEmptyPermissions();
	}
	const typeDefaults =
		role.type && DEFAULT_ROLE_PERMISSIONS[role.type]
			? DEFAULT_ROLE_PERMISSIONS[role.type]
			: createEmptyPermissions();
	const base = normalizePermissions(typeDefaults);
	const stored = normalizePermissions(role.permissions);
	// المخزّن يفوز حيث وُجد؛ الافتراضيات تسد الأقسام المضافة لاحقاً
	if (role.permissions && typeof role.permissions === "object") {
		const storedRaw = role.permissions as Record<string, unknown>;
		for (const section of SECTION_ORDER) {
			if (storedRaw[section]) {
				(base[section] as unknown as Record<string, boolean>) = (
					stored[section] as unknown as Record<string, boolean>
				);
			}
		}
	}
	return base;
}

/** الفروق عن الدور — تُحفظ كـ customPermissions (مفاتيح متغيّرة فقط) */
function diffPermissions(
	matrix: Permissions,
	base: Permissions,
): Record<string, Record<string, boolean>> {
	const diff: Record<string, Record<string, boolean>> = {};
	for (const section of SECTION_ORDER) {
		const matrixSection = matrix[section] as unknown as Record<
			string,
			boolean
		>;
		const baseSection = base[section] as unknown as Record<string, boolean>;
		for (const action of Object.keys(matrixSection)) {
			if ((matrixSection[action] ?? false) !== (baseSection[action] ?? false)) {
				diff[section] = diff[section] ?? {};
				diff[section][action] = matrixSection[action] ?? false;
			}
		}
	}
	return diff;
}

/**
 * محرر صلاحيات العضو: اختيار الدور (preset) + مصفوفة 49 صلاحية.
 * التخصيص فوق الدور يُحسب كـ diff ويُحفظ في User.customPermissions
 * عبر orgUsers.update — الـ backend يبطل كاش الصلاحيات فوراً.
 */
export function PermissionsEditorDialog({
	open,
	onOpenChange,
	organizationId,
	user,
	roles,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	user: EditableUser | null;
	roles: RoleOption[];
}) {
	const queryClient = useQueryClient();
	const updateUserMutation = useMutation(
		orpc.orgUsers.update.mutationOptions(),
	);

	const currentRoleId = user?.organizationRole?.id ?? "";
	const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId);
	const [matrix, setMatrix] = useState<Permissions>(createEmptyPermissions);
	const [initialSnapshot, setInitialSnapshot] = useState("");

	const selectedRole = roles.find((role) => role.id === selectedRoleId);
	const base = useMemo(() => resolveRoleBase(selectedRole), [selectedRole]);
	const isOwnerRole = selectedRole?.type === "OWNER";

	// إعادة التهيئة عند فتح المحرر أو تغيّر العضو
	// biome-ignore lint/correctness/useExhaustiveDependencies: initialize on open/user change only
	useEffect(() => {
		if (!open || !user) {
			return;
		}
		const roleId = user.organizationRole?.id ?? "";
		const roleBase = resolveRoleBase(roles.find((r) => r.id === roleId));
		const initialMatrix = user.customPermissions
			? mergeCustomFull(roleBase, user.customPermissions)
			: roleBase;
		setSelectedRoleId(roleId);
		setMatrix(initialMatrix);
		setInitialSnapshot(JSON.stringify({ roleId, matrix: initialMatrix }));
	}, [open, user?.id]);

	const diff = useMemo(() => diffPermissions(matrix, base), [matrix, base]);
	const customized = Object.keys(diff).length > 0;
	const roleChanged = selectedRoleId !== currentRoleId;
	const hadCustom = !!user?.customPermissions;
	const dirty =
		JSON.stringify({ roleId: selectedRoleId, matrix }) !== initialSnapshot;

	const handleRoleChange = (roleId: string) => {
		setSelectedRoleId(roleId);
		// اختيار الدور يملأ المصفوفة بصلاحياته (preset) — التخصيص يُبنى فوقه
		setMatrix(resolveRoleBase(roles.find((r) => r.id === roleId)));
	};

	const handleToggle = (
		section: keyof Permissions,
		action: string,
		value: boolean,
	) => {
		if (isOwnerRole) {
			return;
		}
		setMatrix((prev) => ({
			...prev,
			[section]: {
				...(prev[section] as unknown as Record<string, boolean>),
				[action]: value,
			},
		}));
	};

	const handleSave = async () => {
		if (!user) {
			return;
		}
		try {
			await updateUserMutation.mutateAsync({
				id: user.id,
				organizationId,
				...(roleChanged && selectedRoleId
					? { organizationRoleId: selectedRoleId }
					: {}),
				...(customized
					? { customPermissions: diff }
					: { resetCustomPermissions: true }),
			});
			toast.success("تم حفظ الصلاحيات");
			queryClient.invalidateQueries({
				queryKey: orpc.orgUsers.list.key(),
			});
			// تحديث صلاحيات الواجهة فوراً إن كان التعديل يمس المستخدم الحالي
			queryClient.invalidateQueries({
				queryKey: orpc.permissions.getMine.key(),
			});
			onOpenChange(false);
		} catch (e) {
			toast.error(
				e && typeof e === "object" && "message" in e
					? (e.message as string)
					: "تعذّر حفظ الصلاحيات",
			);
		}
	};

	if (!user) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				dir="rtl"
				className="max-h-[85vh] max-w-3xl overflow-y-auto"
			>
				<DialogHeader className="text-start">
					<DialogTitle className="flex items-center gap-2">
						تحرير صلاحيات: {user.name}
						{hadCustom && <Badge status="info">مخصص</Badge>}
					</DialogTitle>
					<DialogDescription>
						اختر الدور كأساس ثم خصّص الصلاحيات فوقه. التخصيصات تُميَّز
						بشارة "مخصص".
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center gap-3">
					<span className="shrink-0 font-medium text-sm">الدور:</span>
					<Select value={selectedRoleId} onValueChange={handleRoleChange}>
						<SelectTrigger className="w-56">
							<SelectValue placeholder="اختر الدور" />
						</SelectTrigger>
						<SelectContent>
							{roles.map((role) => (
								<SelectItem key={role.id} value={role.id}>
									{role.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{isOwnerRole ? (
					<Alert>
						<InfoIcon className="size-4" />
						<AlertTitle>
							دور المالك يملك كل الصلاحيات ولا يقبل التخصيص
						</AlertTitle>
					</Alert>
				) : (
					<PermissionMatrix
						values={matrix}
						base={base}
						onChange={handleToggle}
					/>
				)}

				<SaveBar
					dirty={dirty}
					customized={customized || hadCustom}
					saving={updateUserMutation.isPending}
					onSave={handleSave}
					onRevert={() => {
						setSelectedRoleId(currentRoleId);
						const roleBase = resolveRoleBase(
							roles.find((r) => r.id === currentRoleId),
						);
						setMatrix(
							user.customPermissions
								? mergeCustomFull(roleBase, user.customPermissions)
								: roleBase,
						);
					}}
					onResetToRole={() => setMatrix(base)}
				/>
			</DialogContent>
		</Dialog>
	);
}

/** دمج التخصيصات المخزّنة فوق أساس الدور (لأقسام موجودة فقط) */
function mergeCustom(
	base: Permissions,
	custom: unknown,
): Record<string, Record<string, boolean>> {
	const result: Record<string, Record<string, boolean>> = {};
	const customRaw = (custom ?? {}) as Record<string, Record<string, boolean>>;
	for (const section of SECTION_ORDER) {
		result[section] = {
			...(base[section] as unknown as Record<string, boolean>),
			...(customRaw[section] ?? {}),
		};
	}
	return result;
}

function mergeCustomFull(base: Permissions, custom: unknown): Permissions {
	return normalizePermissions(mergeCustom(base, custom));
}

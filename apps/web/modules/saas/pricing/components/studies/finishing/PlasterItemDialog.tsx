"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { BuildingConfig } from "../../../lib/finishing-types";
import {
	MIX_RATIOS,
	PLASTER_METHODS,
	calculatePlasterMaterials,
	type MixRatioKey,
	type PlasterMethodKey,
} from "../../../lib/plaster-config";

// ─── Types ────────────────────────────────────────────────────

interface RoomEntry {
	name: string;
	shape: "rectangular" | "custom";
	wall1: number | "";
	wall2: number | "";
	heightOverride?: number | null; // null = use floor height
	customWalls?: (number | "")[];
}

interface OpeningEntry {
	name: string;
	width: number | "";
	height: number | "";
	count: number | "";
}

interface PlasterItemData {
	id?: string;
	category: string;
	subCategory?: string;
	name: string;
	floorId?: string;
	floorName?: string;
	area?: number;
	length?: number;
	width?: number;
	quantity?: number;
	unit: string;
	calculationMethod?: string;
	calculationData?: Record<string, unknown>;
	wastagePercent: number;
	materialPrice: number;
	laborPrice: number;
	totalCost: number;
}

interface PlasterItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	studyId: string;
	plasterType: "internal_plaster" | "external_plaster";
	editItem?: PlasterItemData;
	buildingConfig?: BuildingConfig | null;
}

// ─── Helpers ──────────────────────────────────────────────────

function makeRoom(index: number): RoomEntry {
	return {
		name: `غ${index}`,
		shape: "rectangular",
		wall1: "",
		wall2: "",
		heightOverride: null,
	};
}

function makeDoor(index: number): OpeningEntry {
	return { name: `ب${index}`, width: "", height: 2.1, count: 1 };
}

function makeWindow(index: number): OpeningEntry {
	return { name: `ش${index}`, width: "", height: 1.2, count: 1 };
}

function numVal(v: number | "" | null | undefined): number {
	return typeof v === "number" ? v : 0;
}

function roomPerimeter(r: RoomEntry): number {
	if (r.shape === "custom" && r.customWalls) {
		return r.customWalls.reduce<number>((s, w) => s + numVal(w), 0);
	}
	return (numVal(r.wall1) + numVal(r.wall2)) * 2;
}

function roomWallArea(r: RoomEntry, floorHeight: number): number {
	const h = r.heightOverride != null ? r.heightOverride : floorHeight;
	return roomPerimeter(r) * h;
}

function roomCeilingArea(r: RoomEntry): number {
	return numVal(r.wall1) * numVal(r.wall2);
}

function openingArea(o: OpeningEntry): number {
	return numVal(o.width) * numVal(o.height) * numVal(o.count);
}

// ─── Component ────────────────────────────────────────────────

export function PlasterItemDialog({
	open,
	onOpenChange,
	organizationId,
	studyId,
	plasterType,
	editItem,
	buildingConfig,
}: PlasterItemDialogProps) {
	const t = useTranslations("pricing.studies.finishing.plaster");
	const tFinishing = useTranslations("pricing.studies.finishing");
	const queryClient = useQueryClient();
	const isEdit = !!editItem?.id;
	const isInternal = plasterType === "internal_plaster";

	const floors = buildingConfig?.floors ?? [];

	// ─── Form state ─────────────────────────────────────
	const [name, setName] = useState("");
	const [plasterMethod, setPlasterMethod] = useState<PlasterMethodKey>("buoj_awtar");
	const [thickness, setThickness] = useState(20);
	const [mixRatio, setMixRatio] = useState<MixRatioKey>("1:6");
	const [floorId, setFloorId] = useState<string>("");
	const [floorHeight, setFloorHeight] = useState(3.0);
	const [rooms, setRooms] = useState<RoomEntry[]>([makeRoom(1)]);
	const [doors, setDoors] = useState<OpeningEntry[]>([makeDoor(1)]);
	const [windows, setWindows] = useState<OpeningEntry[]>([makeWindow(1)]);
	const [includeCeiling, setIncludeCeiling] = useState(true);
	const [editingHeightIdx, setEditingHeightIdx] = useState<number | null>(null);

	// Selected floor from building config
	const selectedFloor = useMemo(
		() => floors.find((f) => f.id === floorId),
		[floors, floorId],
	);

	// ─── Reset form on open ─────────────────────────────
	useEffect(() => {
		if (!open) return;

		if (editItem) {
			const cd = editItem.calculationData as Record<string, unknown> | undefined;
			setName(editItem.name || "");
			setPlasterMethod((cd?.plasterMethod as PlasterMethodKey) ?? "buoj_awtar");
			setThickness((cd?.thickness as number) ?? 20);
			setMixRatio((cd?.mixRatio as MixRatioKey) ?? "1:6");
			setFloorId(editItem.floorId ?? floors[0]?.id ?? "");
			setFloorHeight((cd?.floorHeight as number) ?? editItem.floorId
				? floors.find((f) => f.id === editItem.floorId)?.height ?? 3.0
				: 3.0);
			setIncludeCeiling((cd?.includeCeiling as boolean) ?? true);

			const cdRooms = cd?.rooms as RoomEntry[] | undefined;
			if (cdRooms?.length) {
				setRooms(cdRooms.map((r) => ({
					...r,
					heightOverride: (r as unknown as { heightOverride?: number | null }).heightOverride ?? null,
				})));
			} else {
				setRooms([makeRoom(1)]);
			}

			const cdDoors = cd?.doors as OpeningEntry[] | undefined;
			if (cdDoors?.length) {
				setDoors(cdDoors.map((d) => ({ ...d })));
			} else {
				setDoors([makeDoor(1)]);
			}

			const cdWindows = cd?.windows as OpeningEntry[] | undefined;
			if (cdWindows?.length) {
				setWindows(cdWindows.map((w) => ({ ...w })));
			} else {
				setWindows([makeWindow(1)]);
			}
		} else {
			setName(isInternal ? "لياسة داخلية (جدران وأسقف)" : "لياسة خارجية");
			setPlasterMethod("buoj_awtar");
			setThickness(20);
			setMixRatio(isInternal ? "1:6" : "1:4");
			const defaultFloor = floors[0];
			setFloorId(defaultFloor?.id ?? "");
			setFloorHeight(defaultFloor?.height ?? 3.0);
			setRooms([makeRoom(1)]);
			setDoors([makeDoor(1)]);
			setWindows([makeWindow(1)]);
			setIncludeCeiling(true);
		}
		setEditingHeightIdx(null);
	}, [open, editItem, isInternal, floors]);

	// When floor changes, update height from building config
	useEffect(() => {
		if (selectedFloor) {
			setFloorHeight(selectedFloor.height);
		}
	}, [selectedFloor]);

	// Update thickness when method changes
	useEffect(() => {
		const m = PLASTER_METHODS[plasterMethod];
		if (m) setThickness(m.defaultThickness);
	}, [plasterMethod]);

	// ─── Calculations ───────────────────────────────────
	const method = PLASTER_METHODS[plasterMethod];
	const wastagePercent = method.wastagePercent;

	const wallsGrossArea = useMemo(
		() => rooms.reduce((s, r) => s + roomWallArea(r, floorHeight), 0),
		[rooms, floorHeight],
	);

	const doorsArea = useMemo(
		() => doors.reduce((s, d) => s + openingArea(d), 0),
		[doors],
	);

	const windowsArea = useMemo(
		() => windows.reduce((s, w) => s + openingArea(w), 0),
		[windows],
	);

	const openingsArea = doorsArea + windowsArea;
	const wallsNetArea = Math.max(0, wallsGrossArea - openingsArea);

	const ceilingArea = useMemo(() => {
		if (!isInternal || !includeCeiling) return 0;
		return rooms.reduce((s, r) => s + roomCeilingArea(r), 0);
	}, [rooms, isInternal, includeCeiling]);

	const totalBeforeWastage = wallsNetArea + ceilingArea;
	const wastageArea = totalBeforeWastage * (wastagePercent / 100);
	const finalQuantity = totalBeforeWastage + wastageArea;

	const materials = useMemo(() => {
		if (finalQuantity <= 0) return null;
		return calculatePlasterMaterials({
			totalArea: finalQuantity,
			thickness,
			mixRatio,
		});
	}, [finalQuantity, thickness, mixRatio]);

	// ─── Row management helpers ─────────────────────────
	const addRoom = useCallback(() => {
		setRooms((prev) => {
			const newIdx = prev.length;
			const next = [...prev, makeRoom(newIdx + 1)];
			setTimeout(() => {
				(document.getElementById(`room-${newIdx}-wall1`) as HTMLInputElement)?.focus();
			}, 50);
			return next;
		});
	}, []);

	const removeRoom = useCallback((i: number) => {
		setRooms((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
	}, []);

	const updateRoom = useCallback((i: number, field: keyof RoomEntry, value: unknown) => {
		setRooms((prev) =>
			prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
		);
	}, []);

	const addDoor = useCallback(() => {
		setDoors((prev) => {
			const newIdx = prev.length;
			const next = [...prev, makeDoor(newIdx + 1)];
			setTimeout(() => {
				(document.getElementById(`door-${newIdx}-name`) as HTMLInputElement)?.focus();
			}, 50);
			return next;
		});
	}, []);

	const removeDoor = useCallback((i: number) => {
		setDoors((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
	}, []);

	const updateDoor = useCallback((i: number, field: keyof OpeningEntry, value: unknown) => {
		setDoors((prev) =>
			prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)),
		);
	}, []);

	const addWindow = useCallback(() => {
		setWindows((prev) => {
			const newIdx = prev.length;
			const next = [...prev, makeWindow(newIdx + 1)];
			setTimeout(() => {
				(document.getElementById(`win-${newIdx}-name`) as HTMLInputElement)?.focus();
			}, 50);
			return next;
		});
	}, []);

	const removeWindow = useCallback((i: number) => {
		setWindows((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
	}, []);

	const updateWindow = useCallback((i: number, field: keyof OpeningEntry, value: unknown) => {
		setWindows((prev) =>
			prev.map((w, idx) => (idx === i ? { ...w, [field]: value } : w)),
		);
	}, []);

	// ─── Keyboard nav for fast entry ────────────────────
	const handleRoomKeyDown = useCallback(
		(e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
			const lastCol = isInternal ? 1 : 0; // wall1(0) / wall2(1) for internal, wall1(0) for external
			const isLastCol = colIdx === lastCol;
			const isLastRow = rowIdx === rooms.length - 1;

			if (e.key === "Enter" && isLastCol && isLastRow) {
				e.preventDefault();
				addRoom();
			}
		},
		[rooms.length, addRoom, isInternal],
	);

	const handleDoorKeyDown = useCallback(
		(e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
			const isLastCol = colIdx === 3;
			const isLastRow = rowIdx === doors.length - 1;
			if (e.key === "Enter" && isLastCol && isLastRow) {
				e.preventDefault();
				addDoor();
			}
		},
		[doors.length, addDoor],
	);

	const handleWindowKeyDown = useCallback(
		(e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
			const isLastCol = colIdx === 3;
			const isLastRow = rowIdx === windows.length - 1;
			if (e.key === "Enter" && isLastCol && isLastRow) {
				e.preventDefault();
				addWindow();
			}
		},
		[windows.length, addWindow],
	);

	// ─── Mutations ──────────────────────────────────────
	const createMutation = useMutation(
		orpc.pricing.studies.finishingItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(tFinishing("itemSaved"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
				onOpenChange(false);
			},
			onError: () => toast.error(tFinishing("itemSaveError")),
		}),
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.finishingItem.update.mutationOptions({
			onSuccess: () => {
				toast.success(tFinishing("itemSaved"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
				onOpenChange(false);
			},
			onError: () => toast.error(tFinishing("itemSaveError")),
		}),
	);

	const handleSave = () => {
		const breakdown = {
			wallsGrossArea: Math.round(wallsGrossArea * 100) / 100,
			openingsArea: Math.round(openingsArea * 100) / 100,
			wallsNetArea: Math.round(wallsNetArea * 100) / 100,
			ceilingArea: Math.round(ceilingArea * 100) / 100,
			totalBeforeWastage: Math.round(totalBeforeWastage * 100) / 100,
			wastageArea: Math.round(wastageArea * 100) / 100,
			finalQuantity: Math.round(finalQuantity * 100) / 100,
		};

		const calculationData = {
			plasterMethod,
			thickness,
			mixRatio,
			floorHeight,
			includeCeiling: isInternal ? includeCeiling : false,
			rooms: rooms.map((r) => ({
				name: r.name,
				shape: r.shape,
				wall1: numVal(r.wall1),
				wall2: numVal(r.wall2),
				heightOverride: r.heightOverride,
			})),
			doors: doors.map((d) => ({
				name: d.name,
				width: numVal(d.width),
				height: numVal(d.height),
				count: numVal(d.count),
			})),
			windows: windows.map((w) => ({
				name: w.name,
				width: numVal(w.width),
				height: numVal(w.height),
				count: numVal(w.count),
			})),
			breakdown,
			materials: materials
				? {
						cementBags: materials.cementBags,
						cementKg: materials.cementKg,
						sandVolumeM3: materials.sandVolumeM3,
						bondcreteLiters: materials.bondcreteLiters,
						meshLinearM: materials.meshLinearM,
					}
				: null,
		};

		const floorName = selectedFloor?.name ?? "";
		const itemName = `${name} — ${floorName}`.trim();

		const itemData = {
			name: itemName,
			category: isInternal ? "FINISHING_INTERNAL_PLASTER" : "FINISHING_EXTERNAL_PLASTER",
			subCategory: plasterType,
			floorId,
			floorName,
			area: breakdown.totalBeforeWastage || undefined,
			quantity: breakdown.finalQuantity,
			unit: "m2",
			wastagePercent,
			calculationMethod: "plaster_professional",
			calculationData,
			materialPrice: 0,
			laborPrice: 0,
			materialCost: 0,
			laborCost: 0,
			totalCost: 0,
		};

		if (isEdit && editItem?.id) {
			updateMutation.mutate({
				organizationId,
				costStudyId: studyId,
				id: editItem.id,
				...itemData,
			});
		} else {
			createMutation.mutate({
				organizationId,
				costStudyId: studyId,
				...itemData,
			});
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;
	const canSave = finalQuantity > 0;

	// ─── Parse number input helper ──────────────────────
	const parseNum = (val: string): number | "" => {
		const n = parseFloat(val);
		return Number.isNaN(n) ? "" : n;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEdit
							? tFinishing("editItem")
							: isInternal
								? t("titleInternal")
								: t("titleExternal")}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5">
					{/* Name */}
					<div className="space-y-1">
						<Label className="text-sm">{t("name")}</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>

					{/* Method + Thickness + Mix ratio */}
					<div className="grid grid-cols-3 gap-3">
						<div className="space-y-1">
							<Label className="text-sm">{t("method")}</Label>
							<Select
								value={plasterMethod}
								onValueChange={(v) => setPlasterMethod(v as PlasterMethodKey)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(PLASTER_METHODS).map(([key, val]) => (
										<SelectItem key={key} value={key}>
											{val.ar}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label className="text-sm">{t("thickness")} (مم)</Label>
							<Input
								type="number"
								value={thickness || ""}
								onChange={(e) => setThickness(parseFloat(e.target.value) || 0)}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-sm">{t("mixRatio")}</Label>
							<Select
								value={mixRatio}
								onValueChange={(v) => setMixRatio(v as MixRatioKey)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(MIX_RATIOS).map(([key, val]) => (
										<SelectItem key={key} value={key}>
											{val.label_ar}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Floor picker (dropdown) + Floor height */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-sm">{t("floor")}</Label>
							{floors.length > 0 ? (
								<Select value={floorId} onValueChange={setFloorId}>
									<SelectTrigger>
										<SelectValue placeholder={t("selectFloor")} />
									</SelectTrigger>
									<SelectContent>
										{floors.map((floor) => (
											<SelectItem key={floor.id} value={floor.id}>
												{floor.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<p className="text-xs text-muted-foreground pt-1">
									{t("noFloors")}
								</p>
							)}
						</div>
						<div className="space-y-1">
							<Label className="text-sm">{t("floorHeight")} (م)</Label>
							<Input
								type="number"
								value={floorHeight || ""}
								onChange={(e) => setFloorHeight(parseFloat(e.target.value) || 0)}
								step="0.1"
							/>
							<p className="text-xs text-muted-foreground">
								{t("floorHeightHint")}
							</p>
						</div>
					</div>

					{/* ─── Rooms table ───────────────────────── */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">
								{isInternal ? t("rooms") : t("facades")}
							</Label>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 text-xs"
								onClick={addRoom}
							>
								+ {isInternal ? t("addRoom") : t("addFacade")}
							</Button>
						</div>

						<div className="rounded-lg border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="p-2 text-right font-medium w-24">{t("roomName")}</th>
										<th className="p-2 text-right font-medium">
											{isInternal ? t("wall1") : t("facadeLength")} (م)
										</th>
										{isInternal && (
											<th className="p-2 text-right font-medium">{t("wall2")} (م)</th>
										)}
										<th className="p-2 w-20" />
									</tr>
								</thead>
								<tbody>
									{rooms.map((room, i) => {
										const hasOverride = room.heightOverride != null;
										const effectiveH = hasOverride ? room.heightOverride! : floorHeight;
										const isEditingH = editingHeightIdx === i;

										return (
											<tr key={i} className="border-b last:border-0">
												{/* Name — auto-generated, tabIndex -1 to skip on Tab */}
												<td className="p-1">
													<Input
														id={`room-${i}-name`}
														tabIndex={-1}
														value={room.name}
														onChange={(e) => updateRoom(i, "name", e.target.value)}
														className="h-8 text-sm text-muted-foreground focus:text-foreground"
													/>
												</td>
												{/* Wall 1 */}
												<td className="p-1">
													<Input
														id={`room-${i}-wall1`}
														type="number"
														value={room.wall1}
														onChange={(e) => updateRoom(i, "wall1", parseNum(e.target.value))}
														onKeyDown={(e) => handleRoomKeyDown(e, i, 0)}
														className="h-8 text-sm"
													/>
												</td>
												{/* Wall 2 (internal only) */}
												{isInternal && (
													<td className="p-1">
														<Input
															id={`room-${i}-wall2`}
															type="number"
															value={room.wall2}
															onChange={(e) => updateRoom(i, "wall2", parseNum(e.target.value))}
															onKeyDown={(e) => handleRoomKeyDown(e, i, 1)}
															className="h-8 text-sm"
														/>
													</td>
												)}
												{/* Height override + delete */}
												<td className="p-1">
													<div className="flex items-center gap-1">
														{isEditingH ? (
															<Input
																id={`room-${i}-height-edit`}
																type="number"
																autoFocus
																value={effectiveH || ""}
																onChange={(e) => {
																	const v = parseFloat(e.target.value);
																	updateRoom(i, "heightOverride", Number.isNaN(v) ? null : v);
																}}
																onBlur={() => setEditingHeightIdx(null)}
																onKeyDown={(e) => {
																	if (e.key === "Enter" || e.key === "Escape") {
																		setEditingHeightIdx(null);
																	}
																}}
																className="h-7 w-16 text-xs"
																step="0.1"
																tabIndex={-1}
															/>
														) : (
															<Button
																type="button"
																variant="ghost"
																size="sm"
																className={`h-7 px-1.5 text-xs ${hasOverride ? "text-primary font-medium" : "text-muted-foreground"}`}
																onClick={() => setEditingHeightIdx(i)}
																title={t("editRoomHeight")}
																tabIndex={-1}
															>
																<Pencil className="h-3 w-3 me-1" />
																{effectiveH} م
															</Button>
														)}
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="h-7 w-7"
															onClick={() => removeRoom(i)}
															disabled={rooms.length <= 1}
															tabIndex={-1}
														>
															<Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
														</Button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
						<p className="text-xs text-muted-foreground">{t("keyboardHint")}</p>
					</div>

					{/* ─── Doors table ───────────────────────── */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">{t("doors")}</Label>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 text-xs"
								onClick={addDoor}
							>
								+ {t("addDoor")}
							</Button>
						</div>

						<div className="rounded-lg border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="p-2 text-right font-medium">{t("openingName")}</th>
										<th className="p-2 text-right font-medium">{t("openingWidth")} (م)</th>
										<th className="p-2 text-right font-medium">{t("openingHeight")} (م)</th>
										<th className="p-2 text-right font-medium">{t("openingCount")}</th>
										<th className="p-2 w-10" />
									</tr>
								</thead>
								<tbody>
									{doors.map((door, i) => (
										<tr key={i} className="border-b last:border-0">
											<td className="p-1">
												<Input
													id={`door-${i}-name`}
													value={door.name}
													onChange={(e) => updateDoor(i, "name", e.target.value)}
													onKeyDown={(e) => handleDoorKeyDown(e, i, 0)}
													className="h-8 text-sm"
												/>
											</td>
											<td className="p-1">
												<Input
													id={`door-${i}-width`}
													type="number"
													value={door.width}
													onChange={(e) => updateDoor(i, "width", parseNum(e.target.value))}
													onKeyDown={(e) => handleDoorKeyDown(e, i, 1)}
													className="h-8 text-sm"
												/>
											</td>
											<td className="p-1">
												<Input
													id={`door-${i}-height`}
													type="number"
													value={door.height}
													onChange={(e) => updateDoor(i, "height", parseNum(e.target.value))}
													onKeyDown={(e) => handleDoorKeyDown(e, i, 2)}
													className="h-8 text-sm"
												/>
											</td>
											<td className="p-1">
												<Input
													id={`door-${i}-count`}
													type="number"
													value={door.count}
													onChange={(e) => updateDoor(i, "count", parseNum(e.target.value))}
													onKeyDown={(e) => handleDoorKeyDown(e, i, 3)}
													className="h-8 text-sm"
												/>
											</td>
											<td className="p-1">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-7 w-7"
													onClick={() => removeDoor(i)}
													disabled={doors.length <= 1}
												>
													<Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* ─── Windows table ─────────────────────── */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">{t("windows")}</Label>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 text-xs"
								onClick={addWindow}
							>
								+ {t("addWindow")}
							</Button>
						</div>

						<div className="rounded-lg border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="p-2 text-right font-medium">{t("openingName")}</th>
										<th className="p-2 text-right font-medium">{t("openingWidth")} (م)</th>
										<th className="p-2 text-right font-medium">{t("openingHeight")} (م)</th>
										<th className="p-2 text-right font-medium">{t("openingCount")}</th>
										<th className="p-2 w-10" />
									</tr>
								</thead>
								<tbody>
									{windows.map((win, i) => (
										<tr key={i} className="border-b last:border-0">
											<td className="p-1">
												<Input
													id={`win-${i}-name`}
													value={win.name}
													onChange={(e) => updateWindow(i, "name", e.target.value)}
													onKeyDown={(e) => handleWindowKeyDown(e, i, 0)}
													className="h-8 text-sm"
												/>
											</td>
											<td className="p-1">
												<Input
													id={`win-${i}-width`}
													type="number"
													value={win.width}
													onChange={(e) => updateWindow(i, "width", parseNum(e.target.value))}
													onKeyDown={(e) => handleWindowKeyDown(e, i, 1)}
													className="h-8 text-sm"
												/>
											</td>
											<td className="p-1">
												<Input
													id={`win-${i}-height`}
													type="number"
													value={win.height}
													onChange={(e) => updateWindow(i, "height", parseNum(e.target.value))}
													onKeyDown={(e) => handleWindowKeyDown(e, i, 2)}
													className="h-8 text-sm"
												/>
											</td>
											<td className="p-1">
												<Input
													id={`win-${i}-count`}
													type="number"
													value={win.count}
													onChange={(e) => updateWindow(i, "count", parseNum(e.target.value))}
													onKeyDown={(e) => handleWindowKeyDown(e, i, 3)}
													className="h-8 text-sm"
												/>
											</td>
											<td className="p-1">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-7 w-7"
													onClick={() => removeWindow(i)}
													disabled={windows.length <= 1}
												>
													<Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* ─── Ceiling (internal only) ───────────── */}
					{isInternal && (
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<Checkbox
									id="includeCeiling"
									checked={includeCeiling}
									onCheckedChange={(v) => setIncludeCeiling(v === true)}
								/>
								<Label htmlFor="includeCeiling" className="text-sm cursor-pointer">
									{t("includeCeiling")}
								</Label>
							</div>
							{includeCeiling && ceilingArea > 0 && (
								<p className="text-xs text-muted-foreground me-6">
									{t("ceilingArea")}: {ceilingArea.toFixed(2)} م²
								</p>
							)}
						</div>
					)}

					{/* ─── Summary ───────────────────────────── */}
					{totalBeforeWastage > 0 && (
						<div className="rounded-lg bg-muted p-3 space-y-1.5">
							<p className="font-medium text-sm mb-2">{t("summary")}</p>

							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{t("wallsGrossArea")}</span>
								<span>{wallsGrossArea.toFixed(2)} م²</span>
							</div>

							{openingsArea > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">{t("openingsDeduction")}</span>
									<span>-{openingsArea.toFixed(2)} م²</span>
								</div>
							)}

							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{t("wallsNetArea")}</span>
								<span>{wallsNetArea.toFixed(2)} م²</span>
							</div>

							{isInternal && includeCeiling && ceilingArea > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">{t("ceilingArea")}</span>
									<span>{ceilingArea.toFixed(2)} م²</span>
								</div>
							)}

							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									{isInternal ? t("totalWallsCeiling") : t("totalWalls")}
								</span>
								<span>{totalBeforeWastage.toFixed(2)} م²</span>
							</div>

							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									{t("wastage")} ({wastagePercent}%)
								</span>
								<span>+{wastageArea.toFixed(2)} م²</span>
							</div>

							<div className="flex justify-between font-medium text-sm border-t pt-1.5 mt-1.5">
								<span>{t("finalQuantity")}</span>
								<span>{finalQuantity.toFixed(2)} م²</span>
							</div>

							{/* Materials */}
							{materials && (
								<div className="border-t pt-2 mt-2 space-y-1">
									<p className="text-sm font-medium">{t("materialsRequired")}</p>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">{t("cement")}</span>
										<span>
											{materials.cementBags} {t("bags")} (50 كجم)
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">{t("sand")}</span>
										<span>{materials.sandVolumeM3} م³</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">{t("bondcrete")}</span>
										<span>{materials.bondcreteLiters} {t("liters")}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">{t("mesh")}</span>
										<span>{materials.meshLinearM} م.ط</span>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						{t("cancel")}
					</Button>
					<Button onClick={handleSave} disabled={isPending || !canSave}>
						{isPending ? "جارٍ الحفظ..." : t("save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

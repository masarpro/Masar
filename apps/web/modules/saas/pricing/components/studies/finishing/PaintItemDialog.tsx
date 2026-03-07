"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
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
import { Link2, Pencil, Trash2, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { BuildingConfig } from "../../../lib/finishing-types";
import {
	PAINT_QUALITY_LEVELS,
	PAINT_TYPES,
	calculatePaintMaterials,
	type PaintQualityKey,
	type PaintTypeKey,
} from "../../../lib/paint-config";

// ─── Types ────────────────────────────────────────────────────

interface RoomEntry {
	name: string;
	wall1: number | "";
	wall2: number | "";
	heightOverride?: number | null;
}

interface OpeningEntry {
	name: string;
	width: number | "";
	height: number | "";
	count: number | "";
}

interface PaintItemData {
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
	qualityLevel?: string;
	calculationMethod?: string;
	calculationData?: Record<string, unknown>;
	wastagePercent: number;
	materialPrice: number;
	laborPrice: number;
	totalCost: number;
}

interface FinishingItemForLink {
	id: string;
	category: string;
	subCategory?: string | null;
	floorId?: string | null;
	area?: number | null;
	quantity?: number | null;
	calculationData?: Record<string, unknown> | null;
}

interface PaintItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	studyId: string;
	editItem?: PaintItemData;
	buildingConfig?: BuildingConfig | null;
	allStudyItems?: FinishingItemForLink[];
}

// ─── Helpers ──────────────────────────────────────────────────

function makeRoom(index: number): RoomEntry {
	return { name: `غ${index}`, wall1: "", wall2: "", heightOverride: null };
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

export function PaintItemDialog({
	open,
	onOpenChange,
	organizationId,
	studyId,
	editItem,
	buildingConfig,
	allStudyItems,
}: PaintItemDialogProps) {
	const t = useTranslations("pricing.studies.finishing.paint");
	const tFinishing = useTranslations("pricing.studies.finishing");
	const queryClient = useQueryClient();
	const isEdit = !!editItem?.id;

	const floors = buildingConfig?.floors ?? [];

	// ─── Form state ─────────────────────────────────────
	const [name, setName] = useState("");
	const [paintType, setPaintType] = useState<PaintTypeKey>("plastic_latex");
	const [qualityLevel, setQualityLevel] = useState<PaintQualityKey>("standard");
	const [coats, setCoats] = useState(3);
	const [floorId, setFloorId] = useState<string>("");
	const [floorHeight, setFloorHeight] = useState(3.0);
	const [rooms, setRooms] = useState<RoomEntry[]>([makeRoom(1)]);
	const [doors, setDoors] = useState<OpeningEntry[]>([makeDoor(1)]);
	const [windows, setWindows] = useState<OpeningEntry[]>([makeWindow(1)]);
	const [includeCeiling, setIncludeCeiling] = useState(true);
	const [editingHeightIdx, setEditingHeightIdx] = useState<number | null>(null);
	const [linkedToPlaster, setLinkedToPlaster] = useState(false);

	const selectedFloor = useMemo(
		() => floors.find((f) => f.id === floorId),
		[floors, floorId],
	);

	// Find matching plaster item for the selected floor
	const plasterItemForFloor = useMemo(() => {
		if (!allStudyItems || !floorId) return null;
		const items = allStudyItems.filter(
			(i) =>
				i.category === "FINISHING_INTERNAL_PLASTER" &&
				i.floorId === floorId,
		);
		if (items.length === 0) return null;
		// Sum areas
		const totalArea = items.reduce((s, i) => s + (i.area ?? i.quantity ?? 0), 0);
		// Get calculation data from first item for rooms/doors/windows
		const firstCd = items[0].calculationData as Record<string, unknown> | undefined;
		return { totalArea, calculationData: firstCd };
	}, [allStudyItems, floorId]);

	// ─── Reset form on open ─────────────────────────────
	useEffect(() => {
		if (!open) return;

		if (editItem) {
			const cd = editItem.calculationData as Record<string, unknown> | undefined;
			setName(editItem.name || "");
			setPaintType((cd?.paintType as PaintTypeKey) ?? "plastic_latex");
			setQualityLevel((editItem.qualityLevel as PaintQualityKey) ?? "standard");
			setCoats((cd?.coats as number) ?? 3);
			setFloorId(editItem.floorId ?? floors[0]?.id ?? "");
			setFloorHeight((cd?.floorHeight as number) ?? 3.0);
			setIncludeCeiling((cd?.includeCeiling as boolean) ?? true);
			setLinkedToPlaster((cd?.linkedToPlaster as boolean) ?? false);

			const cdRooms = cd?.rooms as RoomEntry[] | undefined;
			if (cdRooms?.length) {
				setRooms(cdRooms.map((r) => ({ ...r, heightOverride: r.heightOverride ?? null })));
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
			setName("دهان داخلي (جدران وأسقف)");
			setPaintType("plastic_latex");
			setQualityLevel("standard");
			setCoats(3);
			const defaultFloor = floors[0];
			setFloorId(defaultFloor?.id ?? "");
			setFloorHeight(defaultFloor?.height ?? 3.0);
			setRooms([makeRoom(1)]);
			setDoors([makeDoor(1)]);
			setWindows([makeWindow(1)]);
			setIncludeCeiling(true);
			setLinkedToPlaster(false);
		}
		setEditingHeightIdx(null);
	}, [open, editItem, floors]);

	// When floor changes, update height
	useEffect(() => {
		if (selectedFloor) {
			setFloorHeight(selectedFloor.height);
		}
	}, [selectedFloor]);

	// When paint type changes, update coats
	useEffect(() => {
		const p = PAINT_TYPES[paintType];
		if (p) setCoats(p.defaultCoats);
	}, [paintType]);

	// ─── Import from plaster ────────────────────────────
	const handleImportFromPlaster = useCallback(() => {
		if (!plasterItemForFloor?.calculationData) return;
		const cd = plasterItemForFloor.calculationData;

		const cdRooms = cd.rooms as RoomEntry[] | undefined;
		if (cdRooms?.length) {
			setRooms(cdRooms.map((r) => ({ ...r, heightOverride: r.heightOverride ?? null })));
		}

		const cdDoors = cd.doors as OpeningEntry[] | undefined;
		if (cdDoors?.length) {
			setDoors(cdDoors.map((d) => ({ ...d })));
		}

		const cdWindows = cd.windows as OpeningEntry[] | undefined;
		if (cdWindows?.length) {
			setWindows(cdWindows.map((w) => ({ ...w })));
		}

		if (cd.floorHeight) {
			setFloorHeight(cd.floorHeight as number);
		}

		if (typeof cd.includeCeiling === "boolean") {
			setIncludeCeiling(cd.includeCeiling);
		}

		setLinkedToPlaster(true);
	}, [plasterItemForFloor]);

	const handleUnlinkPlaster = useCallback(() => {
		setLinkedToPlaster(false);
	}, []);

	// ─── Calculations ───────────────────────────────────
	const paint = PAINT_TYPES[paintType];
	const wastagePercent = paint.wastagePercent;

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
		if (!includeCeiling) return 0;
		return rooms.reduce((s, r) => s + roomCeilingArea(r), 0);
	}, [rooms, includeCeiling]);

	const totalBeforeWastage = wallsNetArea + ceilingArea;
	const wastageArea = totalBeforeWastage * (wastagePercent / 100);
	const finalQuantity = totalBeforeWastage + wastageArea;

	const materials = useMemo(() => {
		if (finalQuantity <= 0) return null;
		return calculatePaintMaterials({
			totalArea: finalQuantity,
			paintType,
			coats,
		});
	}, [finalQuantity, paintType, coats]);

	// ─── Row management ─────────────────────────────────
	const addRoom = useCallback(() => {
		setRooms((prev) => {
			const newIdx = prev.length;
			const next = [...prev, makeRoom(newIdx + 1)];
			setTimeout(() => {
				(document.getElementById(`paint-room-${newIdx}-wall1`) as HTMLInputElement)?.focus();
			}, 50);
			return next;
		});
	}, []);

	const removeRoom = useCallback((i: number) => {
		setRooms((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
	}, []);

	const updateRoom = useCallback((i: number, field: keyof RoomEntry, value: unknown) => {
		setRooms((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
	}, []);

	const addDoor = useCallback(() => {
		setDoors((prev) => {
			const newIdx = prev.length;
			const next = [...prev, makeDoor(newIdx + 1)];
			setTimeout(() => {
				(document.getElementById(`paint-door-${newIdx}-name`) as HTMLInputElement)?.focus();
			}, 50);
			return next;
		});
	}, []);

	const removeDoor = useCallback((i: number) => {
		setDoors((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
	}, []);

	const updateDoor = useCallback((i: number, field: keyof OpeningEntry, value: unknown) => {
		setDoors((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
	}, []);

	const addWindow = useCallback(() => {
		setWindows((prev) => {
			const newIdx = prev.length;
			const next = [...prev, makeWindow(newIdx + 1)];
			setTimeout(() => {
				(document.getElementById(`paint-win-${newIdx}-name`) as HTMLInputElement)?.focus();
			}, 50);
			return next;
		});
	}, []);

	const removeWindow = useCallback((i: number) => {
		setWindows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
	}, []);

	const updateWindow = useCallback((i: number, field: keyof OpeningEntry, value: unknown) => {
		setWindows((prev) => prev.map((w, idx) => (idx === i ? { ...w, [field]: value } : w)));
	}, []);

	// ─── Keyboard nav ───────────────────────────────────
	const handleRoomKeyDown = useCallback(
		(e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
			if (e.key === "Enter" && colIdx === 1 && rowIdx === rooms.length - 1) {
				e.preventDefault();
				addRoom();
			}
		},
		[rooms.length, addRoom],
	);

	const handleDoorKeyDown = useCallback(
		(e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
			if (e.key === "Enter" && colIdx === 3 && rowIdx === doors.length - 1) {
				e.preventDefault();
				addDoor();
			}
		},
		[doors.length, addDoor],
	);

	const handleWindowKeyDown = useCallback(
		(e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
			if (e.key === "Enter" && colIdx === 3 && rowIdx === windows.length - 1) {
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
				queryClient.invalidateQueries({ queryKey: [["pricing", "studies", "getById"]] });
				onOpenChange(false);
			},
			onError: () => toast.error(tFinishing("itemSaveError")),
		}),
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.finishingItem.update.mutationOptions({
			onSuccess: () => {
				toast.success(tFinishing("itemSaved"));
				queryClient.invalidateQueries({ queryKey: [["pricing", "studies", "getById"]] });
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
			paintType,
			coats,
			floorHeight,
			includeCeiling,
			linkedToPlaster,
			rooms: rooms.map((r) => ({
				name: r.name,
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
						paintLiters: materials.paintLiters,
						paintGallons: materials.paintGallons,
						paintDrums18L: materials.paintDrums18L,
						primerLiters: materials.primerLiters,
						puttyKg: materials.puttyKg,
					}
				: null,
		};

		const floorName = selectedFloor?.name ?? "";
		const itemName = `${name} — ${floorName}`.trim();

		const itemData = {
			name: itemName,
			category: "FINISHING_INTERIOR_PAINT",
			subCategory: paintType,
			floorId,
			floorName,
			qualityLevel: qualityLevel,
			area: breakdown.totalBeforeWastage || undefined,
			quantity: breakdown.finalQuantity,
			unit: "m2",
			wastagePercent,
			calculationMethod: "paint_professional",
			calculationData,
			materialPrice: 0,
			laborPrice: 0,
			materialCost: 0,
			laborCost: 0,
			totalCost: 0,
		};

		if (isEdit && editItem?.id) {
			updateMutation.mutate({ organizationId, costStudyId: studyId, id: editItem.id, ...itemData });
		} else {
			createMutation.mutate({ organizationId, costStudyId: studyId, ...itemData });
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;
	const canSave = finalQuantity > 0;

	const parseNum = (val: string): number | "" => {
		const n = parseFloat(val);
		return Number.isNaN(n) ? "" : n;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? tFinishing("editItem") : t("title")}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5">
					{/* Name */}
					<div className="space-y-1">
						<Label className="text-sm">{t("name")}</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>

					{/* Paint type + Quality + Coats */}
					<div className="grid grid-cols-3 gap-3">
						<div className="space-y-1">
							<Label className="text-sm">{t("paintType")}</Label>
							<Select value={paintType} onValueChange={(v) => setPaintType(v as PaintTypeKey)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									{Object.entries(PAINT_TYPES).map(([key, val]) => (
										<SelectItem key={key} value={key}>{val.ar}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label className="text-sm">{t("quality")}</Label>
							<Select value={qualityLevel} onValueChange={(v) => setQualityLevel(v as PaintQualityKey)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									{Object.entries(PAINT_QUALITY_LEVELS).map(([key, val]) => (
										<SelectItem key={key} value={key}>
											<span>{val.ar}</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label className="text-sm">{t("coats")}</Label>
							<Select value={String(coats)} onValueChange={(v) => setCoats(Number(v))}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="1">{t("coat1")}</SelectItem>
									<SelectItem value="2">{t("coat2")}</SelectItem>
									<SelectItem value="3">{t("coat3")}</SelectItem>
									<SelectItem value="4">{t("coat4")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Quality price hint */}
					<div className="text-xs text-muted-foreground">
						{t("priceRange")}: {PAINT_QUALITY_LEVELS[qualityLevel].priceRange}
					</div>

					{/* Floor picker + height */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-sm">{t("floor")}</Label>
							{floors.length > 0 ? (
								<Select value={floorId} onValueChange={setFloorId}>
									<SelectTrigger><SelectValue placeholder={t("selectFloor")} /></SelectTrigger>
									<SelectContent>
										{floors.map((floor) => (
											<SelectItem key={floor.id} value={floor.id}>{floor.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<p className="text-xs text-muted-foreground pt-1">{t("noFloors")}</p>
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
							<p className="text-xs text-muted-foreground">{t("floorHeightHint")}</p>
						</div>
					</div>

					{/* Link to plaster */}
					{plasterItemForFloor && (
						<div className="rounded-lg border p-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Link2 className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">{t("linkToPlaster")}</span>
								</div>
								{linkedToPlaster ? (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-7 text-xs"
										onClick={handleUnlinkPlaster}
									>
										<Unlink className="h-3 w-3 me-1" />
										{t("unlink")}
									</Button>
								) : (
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-7 text-xs"
										onClick={handleImportFromPlaster}
									>
										<Link2 className="h-3 w-3 me-1" />
										{t("importFromPlaster")}
									</Button>
								)}
							</div>
							{linkedToPlaster && (
								<Badge variant="secondary" className="mt-2 text-xs">
									{t("linkedBadge")}
								</Badge>
							)}
							<p className="text-xs text-muted-foreground mt-1">
								{t("plasterArea")}: {plasterItemForFloor.totalArea.toFixed(2)} م²
							</p>
						</div>
					)}

					{/* ─── Rooms table ───────────────────────── */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">{t("rooms")}</Label>
							<Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addRoom}>
								+ {t("addRoom")}
							</Button>
						</div>

						<div className="rounded-lg border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="p-2 text-right font-medium w-24">{t("roomName")}</th>
										<th className="p-2 text-right font-medium">{t("wall1")} (م)</th>
										<th className="p-2 text-right font-medium">{t("wall2")} (م)</th>
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
												<td className="p-1">
													<Input
														id={`paint-room-${i}-name`}
														tabIndex={-1}
														value={room.name}
														onChange={(e) => updateRoom(i, "name", e.target.value)}
														className="h-8 text-sm text-muted-foreground focus:text-foreground"
													/>
												</td>
												<td className="p-1">
													<Input
														id={`paint-room-${i}-wall1`}
														type="number"
														value={room.wall1}
														onChange={(e) => updateRoom(i, "wall1", parseNum(e.target.value))}
														onKeyDown={(e) => handleRoomKeyDown(e, i, 0)}
														className="h-8 text-sm"
													/>
												</td>
												<td className="p-1">
													<Input
														id={`paint-room-${i}-wall2`}
														type="number"
														value={room.wall2}
														onChange={(e) => updateRoom(i, "wall2", parseNum(e.target.value))}
														onKeyDown={(e) => handleRoomKeyDown(e, i, 1)}
														className="h-8 text-sm"
													/>
												</td>
												<td className="p-1">
													<div className="flex items-center gap-1">
														{isEditingH ? (
															<Input
																type="number"
																autoFocus
																value={effectiveH || ""}
																onChange={(e) => {
																	const v = parseFloat(e.target.value);
																	updateRoom(i, "heightOverride", Number.isNaN(v) ? null : v);
																}}
																onBlur={() => setEditingHeightIdx(null)}
																onKeyDown={(e) => {
																	if (e.key === "Enter" || e.key === "Escape") setEditingHeightIdx(null);
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
							<Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addDoor}>
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
												<Input id={`paint-door-${i}-name`} value={door.name}
													onChange={(e) => updateDoor(i, "name", e.target.value)}
													onKeyDown={(e) => handleDoorKeyDown(e, i, 0)} className="h-8 text-sm" />
											</td>
											<td className="p-1">
												<Input id={`paint-door-${i}-width`} type="number" value={door.width}
													onChange={(e) => updateDoor(i, "width", parseNum(e.target.value))}
													onKeyDown={(e) => handleDoorKeyDown(e, i, 1)} className="h-8 text-sm" />
											</td>
											<td className="p-1">
												<Input id={`paint-door-${i}-height`} type="number" value={door.height}
													onChange={(e) => updateDoor(i, "height", parseNum(e.target.value))}
													onKeyDown={(e) => handleDoorKeyDown(e, i, 2)} className="h-8 text-sm" />
											</td>
											<td className="p-1">
												<Input id={`paint-door-${i}-count`} type="number" value={door.count}
													onChange={(e) => updateDoor(i, "count", parseNum(e.target.value))}
													onKeyDown={(e) => handleDoorKeyDown(e, i, 3)} className="h-8 text-sm" />
											</td>
											<td className="p-1">
												<Button type="button" variant="ghost" size="icon" className="h-7 w-7"
													onClick={() => removeDoor(i)} disabled={doors.length <= 1}>
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
							<Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addWindow}>
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
												<Input id={`paint-win-${i}-name`} value={win.name}
													onChange={(e) => updateWindow(i, "name", e.target.value)}
													onKeyDown={(e) => handleWindowKeyDown(e, i, 0)} className="h-8 text-sm" />
											</td>
											<td className="p-1">
												<Input id={`paint-win-${i}-width`} type="number" value={win.width}
													onChange={(e) => updateWindow(i, "width", parseNum(e.target.value))}
													onKeyDown={(e) => handleWindowKeyDown(e, i, 1)} className="h-8 text-sm" />
											</td>
											<td className="p-1">
												<Input id={`paint-win-${i}-height`} type="number" value={win.height}
													onChange={(e) => updateWindow(i, "height", parseNum(e.target.value))}
													onKeyDown={(e) => handleWindowKeyDown(e, i, 2)} className="h-8 text-sm" />
											</td>
											<td className="p-1">
												<Input id={`paint-win-${i}-count`} type="number" value={win.count}
													onChange={(e) => updateWindow(i, "count", parseNum(e.target.value))}
													onKeyDown={(e) => handleWindowKeyDown(e, i, 3)} className="h-8 text-sm" />
											</td>
											<td className="p-1">
												<Button type="button" variant="ghost" size="icon" className="h-7 w-7"
													onClick={() => removeWindow(i)} disabled={windows.length <= 1}>
													<Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* ─── Ceiling ────────────────────────────── */}
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<Checkbox id="paintIncludeCeiling" checked={includeCeiling}
								onCheckedChange={(v) => setIncludeCeiling(v === true)} />
							<Label htmlFor="paintIncludeCeiling" className="text-sm cursor-pointer">
								{t("includeCeiling")}
							</Label>
						</div>
						{includeCeiling && ceilingArea > 0 && (
							<p className="text-xs text-muted-foreground me-6">
								{t("ceilingArea")}: {ceilingArea.toFixed(2)} م²
							</p>
						)}
					</div>

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
							{includeCeiling && ceilingArea > 0 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">{t("ceilingArea")}</span>
									<span>{ceilingArea.toFixed(2)} م²</span>
								</div>
							)}
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{t("totalWallsCeiling")}</span>
								<span>{totalBeforeWastage.toFixed(2)} م²</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{t("wastage")} ({wastagePercent}%)</span>
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
										<span className="text-muted-foreground">
											{t("paintAmount")} ({coats} {t("coatsLabel")})
										</span>
										<span>{materials.paintLiters} {t("liters")} ({materials.paintDrums18L} {t("drum18L")})</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">{t("primer")}</span>
										<span>{materials.primerLiters} {t("liters")}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">{t("putty")}</span>
										<span>{materials.puttyKg} كجم</span>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
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

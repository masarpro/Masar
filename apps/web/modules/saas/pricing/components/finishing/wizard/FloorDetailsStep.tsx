"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import {
	Bath,
	BedDouble,
	ChefHat,
	Copy,
	DoorOpen,
	Plus,
	Sofa,
	Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import type {
	SmartBuildingConfig,
	SmartFloorConfig,
	RoomConfig,
	RoomType,
	OpeningConfig,
} from "../../../lib/smart-building-types";
import { DEFAULT_OPENINGS } from "../../../lib/smart-building-types";
import { formatNumber } from "../../../lib/utils";

interface FloorDetailsStepProps {
	config: SmartBuildingConfig;
	onChange: (config: SmartBuildingConfig) => void;
}

const ROOM_PRESETS: Array<{
	type: RoomType;
	nameAr: string;
	icon: typeof BedDouble;
}> = [
	{ type: "bedroom", nameAr: "غرفة نوم", icon: BedDouble },
	{ type: "living", nameAr: "صالة", icon: Sofa },
	{ type: "majlis", nameAr: "مجلس", icon: Sofa },
	{ type: "kitchen", nameAr: "مطبخ", icon: ChefHat },
	{ type: "bathroom", nameAr: "حمام", icon: Bath },
	{ type: "corridor", nameAr: "ممر", icon: DoorOpen },
];

const OPENING_PRESETS = Object.entries(DEFAULT_OPENINGS).map(
	([name, data]) => ({
		name,
		...data,
		type: name.includes("نافذة")
			? ("window" as const)
			: ("door" as const),
	}),
);

export function FloorDetailsStep({
	config,
	onChange,
}: FloorDetailsStepProps) {
	const tw = useTranslations("pricing.studies.finishing.wizard");
	const t = useTranslations("pricing.studies.finishing.buildingConfig");

	const habitableFloors = config.floors.filter(
		(f) => f.floorType !== "ROOF",
	);
	const [activeFloorId, setActiveFloorId] = useState(
		habitableFloors[0]?.id ?? "",
	);

	const activeFloor = config.floors.find((f) => f.id === activeFloorId);

	const updateFloor = useCallback(
		(floorId: string, update: Partial<SmartFloorConfig>) => {
			onChange({
				...config,
				floors: config.floors.map((f) =>
					f.id === floorId ? { ...f, ...update } : f,
				),
			});
		},
		[config, onChange],
	);

	// ── Room operations ──

	const addRoom = useCallback(
		(floorId: string, type: RoomType, nameAr: string) => {
			const floor = config.floors.find((f) => f.id === floorId);
			if (!floor) return;
			const rooms = floor.rooms ?? [];
			const sameTypeCount = rooms.filter((r) => r.type === type).length;
			const newRoom: RoomConfig = {
				id: crypto.randomUUID(),
				name:
					sameTypeCount > 0
						? `${nameAr} ${sameTypeCount + 1}`
						: nameAr,
				length: 0,
				width: 0,
				type,
				hasFalseCeiling: true,
			};
			updateFloor(floorId, { rooms: [...rooms, newRoom] });
		},
		[config.floors, updateFloor],
	);

	const updateRoom = useCallback(
		(
			floorId: string,
			roomId: string,
			field: keyof RoomConfig,
			value: string | number | boolean,
		) => {
			const floor = config.floors.find((f) => f.id === floorId);
			if (!floor) return;
			updateFloor(floorId, {
				rooms: (floor.rooms ?? []).map((r) =>
					r.id === roomId ? { ...r, [field]: value } : r,
				),
			});
		},
		[config.floors, updateFloor],
	);

	const removeRoom = useCallback(
		(floorId: string, roomId: string) => {
			const floor = config.floors.find((f) => f.id === floorId);
			if (!floor) return;
			updateFloor(floorId, {
				rooms: (floor.rooms ?? []).filter((r) => r.id !== roomId),
			});
		},
		[config.floors, updateFloor],
	);

	// ── Opening operations ──

	const addOpening = useCallback(
		(
			floorId: string,
			preset: (typeof OPENING_PRESETS)[number],
		) => {
			const floor = config.floors.find((f) => f.id === floorId);
			if (!floor) return;
			const openings = floor.openings ?? [];
			const newOpening: OpeningConfig = {
				id: crypto.randomUUID(),
				type: preset.type,
				subType: preset.name,
				width: preset.width,
				height: preset.height,
				count: 1,
				isExternal: preset.isExternal,
			};
			updateFloor(floorId, { openings: [...openings, newOpening] });
		},
		[config.floors, updateFloor],
	);

	const updateOpening = useCallback(
		(
			floorId: string,
			openingId: string,
			field: keyof OpeningConfig,
			value: string | number | boolean,
		) => {
			const floor = config.floors.find((f) => f.id === floorId);
			if (!floor) return;
			updateFloor(floorId, {
				openings: (floor.openings ?? []).map((o) =>
					o.id === openingId ? { ...o, [field]: value } : o,
				),
			});
		},
		[config.floors, updateFloor],
	);

	const removeOpening = useCallback(
		(floorId: string, openingId: string) => {
			const floor = config.floors.find((f) => f.id === floorId);
			if (!floor) return;
			updateFloor(floorId, {
				openings: (floor.openings ?? []).filter(
					(o) => o.id !== openingId,
				),
			});
		},
		[config.floors, updateFloor],
	);

	// ── Copy operations ──

	const copyRoomsFromFloor = useCallback(
		(targetFloorId: string, sourceFloorId: string) => {
			const source = config.floors.find((f) => f.id === sourceFloorId);
			if (!source?.rooms) return;
			const copiedRooms = source.rooms.map((r) => ({
				...r,
				id: crypto.randomUUID(),
			}));
			updateFloor(targetFloorId, { rooms: copiedRooms });
		},
		[config.floors, updateFloor],
	);

	const copyOpeningsFromFloor = useCallback(
		(targetFloorId: string, sourceFloorId: string) => {
			const source = config.floors.find((f) => f.id === sourceFloorId);
			if (!source?.openings) return;
			const copiedOpenings = source.openings.map((o) => ({
				...o,
				id: crypto.randomUUID(),
			}));
			updateFloor(targetFloorId, { openings: copiedOpenings });
		},
		[config.floors, updateFloor],
	);

	if (habitableFloors.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				لا توجد أدوار. ارجع للخطوة السابقة لإضافة أدوار.
			</div>
		);
	}

	const rooms = activeFloor?.rooms ?? [];
	const openings = activeFloor?.openings ?? [];
	const totalRoomArea = rooms.reduce(
		(s, r) => s + r.length * r.width,
		0,
	);
	const areaDiff = activeFloor
		? activeFloor.area - totalRoomArea
		: 0;
	const doorCount = openings
		.filter((o) => o.type === "door")
		.reduce((s, o) => s + o.count, 0);
	const windowCount = openings
		.filter((o) => o.type === "window")
		.reduce((s, o) => s + o.count, 0);
	const totalOpeningsArea = openings.reduce(
		(s, o) => s + o.width * o.height * o.count,
		0,
	);
	const otherFloors = habitableFloors.filter(
		(f) => f.id !== activeFloorId,
	);

	return (
		<div className="space-y-4">
			{/* Floor tabs */}
			<div className="flex gap-1.5 overflow-x-auto pb-1">
				{habitableFloors.map((floor) => (
					<Button
						key={floor.id}
						variant={
							floor.id === activeFloorId
								? "primary"
								: "outline"
						}
						size="sm"
						className="text-xs shrink-0"
						onClick={() => setActiveFloorId(floor.id)}
					>
						{floor.name}
						{(floor.rooms?.length ?? 0) > 0 && (
							<Badge
								variant="secondary"
								className="ms-1.5 text-[10px] px-1 py-0"
							>
								{floor.rooms!.length}
							</Badge>
						)}
					</Button>
				))}
			</div>

			{activeFloor && (
				<div className="space-y-5">
					{/* ── Rooms Section ── */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">
								الغرف
							</Label>
							{otherFloors.length > 0 && (
								<Select
									onValueChange={(v) =>
										copyRoomsFromFloor(activeFloorId, v)
									}
								>
									<SelectTrigger className="h-7 w-auto text-xs gap-1.5">
										<Copy className="h-3 w-3" />
										<SelectValue
											placeholder={tw("copyFromFloor")}
										/>
									</SelectTrigger>
									<SelectContent>
										{otherFloors.map((f) => (
											<SelectItem
												key={f.id}
												value={f.id}
											>
												{f.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>

						{/* Room rows */}
						{rooms.length > 0 && (
							<div className="space-y-1.5">
								{/* Header */}
								<div className="grid grid-cols-[1fr_100px_80px_80px_80px_32px] gap-1.5 px-1 text-[10px] text-muted-foreground">
									<span>الاسم</span>
									<span>النوع</span>
									<span>الطول (م)</span>
									<span>العرض (م)</span>
									<span>المساحة</span>
									<span />
								</div>
								{rooms.map((room) => (
									<div
										key={room.id}
										className="grid grid-cols-[1fr_100px_80px_80px_80px_32px] gap-1.5 items-center"
									>
										<Input
											value={room.name}
											onChange={(e) =>
												updateRoom(
													activeFloorId,
													room.id,
													"name",
													e.target.value,
												)
											}
											className="h-8 text-sm"
										/>
										<Select
											value={room.type}
											onValueChange={(v) =>
												updateRoom(
													activeFloorId,
													room.id,
													"type",
													v,
												)
											}
										>
											<SelectTrigger className="h-8 text-xs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{ROOM_PRESETS.map((p) => (
													<SelectItem
														key={p.type}
														value={p.type}
													>
														{tw(
															`roomTypes.${p.type}`,
														)}
													</SelectItem>
												))}
												<SelectItem value="hall">
													{tw("roomTypes.hall")}
												</SelectItem>
												<SelectItem value="storage">
													{tw("roomTypes.storage")}
												</SelectItem>
												<SelectItem value="laundry">
													{tw("roomTypes.laundry")}
												</SelectItem>
												<SelectItem value="maid_room">
													{tw("roomTypes.maid_room")}
												</SelectItem>
												<SelectItem value="other">
													{tw("roomTypes.other")}
												</SelectItem>
											</SelectContent>
										</Select>
										<Input
											type="number"
											value={room.length || ""}
											onChange={(e) =>
												updateRoom(
													activeFloorId,
													room.id,
													"length",
													parseFloat(
														e.target.value,
													) || 0,
												)
											}
											className="h-8 text-sm"
											step="0.1"
										/>
										<Input
											type="number"
											value={room.width || ""}
											onChange={(e) =>
												updateRoom(
													activeFloorId,
													room.id,
													"width",
													parseFloat(
														e.target.value,
													) || 0,
												)
											}
											className="h-8 text-sm"
											step="0.1"
										/>
										<span className="text-xs text-muted-foreground text-center">
											{formatNumber(
												room.length * room.width,
												1,
											)}
										</span>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-destructive hover:text-destructive"
											onClick={() =>
												removeRoom(
													activeFloorId,
													room.id,
												)
											}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								))}
							</div>
						)}

						{/* Quick add room buttons */}
						<div className="flex flex-wrap gap-1">
							{ROOM_PRESETS.map((preset) => (
								<Button
									key={preset.type}
									variant="outline"
									size="sm"
									className="text-xs h-7"
									onClick={() =>
										addRoom(
											activeFloorId,
											preset.type,
											preset.nameAr,
										)
									}
								>
									<Plus className="h-3 w-3 me-1" />
									{preset.nameAr}
								</Button>
							))}
						</div>

						{/* Room summary */}
						{rooms.length > 0 && (
							<div className="flex flex-wrap gap-3 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5">
								<span>
									{tw("roomCount")}: <b>{rooms.length}</b>
								</span>
								<span>
									المساحة المحسوبة:{" "}
									<b>{formatNumber(totalRoomArea, 1)} م²</b>
								</span>
								{activeFloor.area > 0 && (
									<span
										className={
											Math.abs(areaDiff) > 1
												? "text-amber-600"
												: ""
										}
									>
										الفرق:{" "}
										<b>
											{areaDiff > 0 ? "+" : ""}
											{formatNumber(areaDiff, 1)} م²
										</b>
									</span>
								)}
							</div>
						)}
					</div>

					{/* ── Openings Section ── */}
					<div className="space-y-3 border-t pt-4">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">
								الفتحات (أبواب ونوافذ)
							</Label>
							{otherFloors.length > 0 && (
								<Select
									onValueChange={(v) =>
										copyOpeningsFromFloor(
											activeFloorId,
											v,
										)
									}
								>
									<SelectTrigger className="h-7 w-auto text-xs gap-1.5">
										<Copy className="h-3 w-3" />
										<SelectValue
											placeholder={tw("copyFromFloor")}
										/>
									</SelectTrigger>
									<SelectContent>
										{otherFloors.map((f) => (
											<SelectItem
												key={f.id}
												value={f.id}
											>
												{f.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>

						{/* Opening rows */}
						{openings.length > 0 && (
							<div className="space-y-1.5">
								<div className="grid grid-cols-[1fr_70px_70px_60px_60px_32px] gap-1.5 px-1 text-[10px] text-muted-foreground">
									<span>النوع</span>
									<span>العرض (م)</span>
									<span>الارتفاع (م)</span>
									<span>العدد</span>
									<span>خارجي</span>
									<span />
								</div>
								{openings.map((opening) => (
									<div
										key={opening.id}
										className="grid grid-cols-[1fr_70px_70px_60px_60px_32px] gap-1.5 items-center"
									>
										<Input
											value={opening.subType}
											onChange={(e) =>
												updateOpening(
													activeFloorId,
													opening.id,
													"subType",
													e.target.value,
												)
											}
											className="h-8 text-sm"
										/>
										<Input
											type="number"
											value={opening.width || ""}
											onChange={(e) =>
												updateOpening(
													activeFloorId,
													opening.id,
													"width",
													parseFloat(
														e.target.value,
													) || 0,
												)
											}
											className="h-8 text-sm"
											step="0.1"
										/>
										<Input
											type="number"
											value={opening.height || ""}
											onChange={(e) =>
												updateOpening(
													activeFloorId,
													opening.id,
													"height",
													parseFloat(
														e.target.value,
													) || 0,
												)
											}
											className="h-8 text-sm"
											step="0.1"
										/>
										<Input
											type="number"
											value={opening.count || ""}
											onChange={(e) =>
												updateOpening(
													activeFloorId,
													opening.id,
													"count",
													Math.max(
														1,
														parseInt(
															e.target.value,
														) || 1,
													),
												)
											}
											className="h-8 text-sm"
											min={1}
										/>
										<div className="flex justify-center">
											<input
												type="checkbox"
												checked={opening.isExternal}
												onChange={(e) =>
													updateOpening(
														activeFloorId,
														opening.id,
														"isExternal",
														e.target.checked,
													)
												}
												className="h-4 w-4 rounded border-input"
											/>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-destructive hover:text-destructive"
											onClick={() =>
												removeOpening(
													activeFloorId,
													opening.id,
												)
											}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								))}
							</div>
						)}

						{/* Quick add opening buttons */}
						<div className="flex flex-wrap gap-1">
							{OPENING_PRESETS.map((preset) => (
								<Button
									key={preset.name}
									variant="outline"
									size="sm"
									className="text-xs h-7"
									onClick={() =>
										addOpening(activeFloorId, preset)
									}
								>
									<Plus className="h-3 w-3 me-1" />
									{preset.name}
								</Button>
							))}
						</div>

						{/* Opening summary */}
						{openings.length > 0 && (
							<div className="flex flex-wrap gap-3 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5">
								<span>
									أبواب: <b>{doorCount}</b>
								</span>
								<span>
									نوافذ: <b>{windowCount}</b>
								</span>
								<span>
									مساحة الفتحات:{" "}
									<b>
										{formatNumber(totalOpeningsArea, 1)} م²
									</b>
								</span>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

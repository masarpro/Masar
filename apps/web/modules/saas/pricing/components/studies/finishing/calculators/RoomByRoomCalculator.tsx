"use client";

import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import type { CalculatorResult } from "../../../../lib/finishing-types";

interface Room {
	id: string;
	name: string;
	length: number;
	width: number;
	area: number;
	useDirectArea: boolean;
}

interface RoomByRoomCalculatorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onApply: (result: CalculatorResult) => void;
	initialData?: { rooms?: Room[] };
}

let roomCounter = 0;
function nextRoomId() {
	roomCounter++;
	return `room-${roomCounter}`;
}

export function RoomByRoomCalculator({
	open,
	onOpenChange,
	onApply,
	initialData,
}: RoomByRoomCalculatorProps) {
	const t = useTranslations("pricing.studies.finishing.calculator");
	const [rooms, setRooms] = useState<Room[]>(
		initialData?.rooms ?? [
			{ id: nextRoomId(), name: "غرفة 1", length: 0, width: 0, area: 0, useDirectArea: false },
		],
	);
	const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

	const totalArea = rooms.reduce((sum, r) => sum + (r.useDirectArea ? r.area : r.length * r.width), 0);

	const addRoom = useCallback(() => {
		const newId = nextRoomId();
		setRooms((prev) => [
			...prev,
			{
				id: newId,
				name: `غرفة ${prev.length + 1}`,
				length: 0,
				width: 0,
				area: 0,
				useDirectArea: false,
			},
		]);
		setTimeout(() => {
			inputRefs.current.get(`${newId}-name`)?.focus();
		}, 50);
	}, []);

	const updateRoom = useCallback((id: string, field: keyof Room, value: string | number | boolean) => {
		setRooms((prev) =>
			prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
		);
	}, []);

	const removeRoom = useCallback((id: string) => {
		setRooms((prev) => prev.filter((r) => r.id !== id));
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent, roomId: string, field: string) => {
			if (e.key === "Enter") {
				e.preventDefault();
				const roomIndex = rooms.findIndex((r) => r.id === roomId);
				if (field === "name") {
					inputRefs.current.get(`${roomId}-length`)?.focus();
				} else if (field === "length") {
					inputRefs.current.get(`${roomId}-width`)?.focus();
				} else if (field === "width") {
					if (roomIndex === rooms.length - 1) {
						addRoom();
					} else {
						const nextRoom = rooms[roomIndex + 1];
						if (nextRoom) {
							inputRefs.current.get(`${nextRoom.id}-name`)?.focus();
						}
					}
				}
			}
		},
		[rooms, addRoom],
	);

	const handleApply = () => {
		onApply({
			area: Math.round(totalArea * 100) / 100,
			calculationData: {
				method: "ROOM_BY_ROOM",
				rooms: rooms.map((r) => ({
					name: r.name,
					length: r.length,
					width: r.width,
					area: r.useDirectArea ? r.area : r.length * r.width,
				})),
			},
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("roomByRoom")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					{rooms.map((room) => (
						<div
							key={room.id}
							className="flex items-end gap-2 rounded-lg border p-3"
						>
							<div className="flex-1 space-y-1">
								<Label className="text-xs">{t("roomName")}</Label>
								<input
									ref={(el) => {
										if (el) inputRefs.current.set(`${room.id}-name`, el);
									}}
									value={room.name}
									onChange={(e) => updateRoom(room.id, "name", e.target.value)}
									onKeyDown={(e) => handleKeyDown(e, room.id, "name")}
									className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>
							<div className="w-20 space-y-1">
								<Label className="text-xs">الطول</Label>
								<input
									ref={(el) => {
										if (el) inputRefs.current.set(`${room.id}-length`, el);
									}}
									type="number"
									value={room.length || ""}
									onChange={(e) =>
										updateRoom(room.id, "length", parseFloat(e.target.value) || 0)
									}
									onKeyDown={(e) => handleKeyDown(e, room.id, "length")}
									className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									placeholder="م"
								/>
							</div>
							<span className="pb-1 text-muted-foreground">×</span>
							<div className="w-20 space-y-1">
								<Label className="text-xs">العرض</Label>
								<input
									ref={(el) => {
										if (el) inputRefs.current.set(`${room.id}-width`, el);
									}}
									type="number"
									value={room.width || ""}
									onChange={(e) =>
										updateRoom(room.id, "width", parseFloat(e.target.value) || 0)
									}
									onKeyDown={(e) => handleKeyDown(e, room.id, "width")}
									className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									placeholder="م"
								/>
							</div>
							<div className="w-20 text-center pb-1">
								<span className="text-sm font-medium">
									{(room.useDirectArea ? room.area : room.length * room.width).toFixed(1)} م²
								</span>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 shrink-0"
								onClick={() => removeRoom(room.id)}
								disabled={rooms.length <= 1}
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</div>
					))}

					<Button
						variant="outline"
						size="sm"
						onClick={addRoom}
						className="w-full"
					>
						<Plus className="h-4 w-4 me-1" />
						{t("addRoom")}
					</Button>

					<div className="rounded-lg bg-muted p-3 text-center">
						<p className="text-sm text-muted-foreground">{t("totalArea")}</p>
						<p className="text-2xl font-bold">{totalArea.toFixed(2)} م²</p>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						إلغاء
					</Button>
					<Button onClick={handleApply}>{t("apply")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

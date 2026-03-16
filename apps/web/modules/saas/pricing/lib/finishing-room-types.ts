// ─── Shared Room/Opening Types & Helpers for Finishing Dialogs ─────────

/**
 * A room entry used in paint and plaster calculation dialogs.
 * - `shape` and `customWalls` are used by PlasterItemDialog for custom-shaped rooms.
 * - Paint dialogs always use rectangular rooms (shape defaults to "rectangular").
 */
export interface RoomEntry {
	name: string;
	/** Defaults to "rectangular" when omitted (e.g. paint rooms). */
	shape?: "rectangular" | "custom";
	wall1: number | "";
	wall2: number | "";
	heightOverride?: number | null; // null = use floor height
	customWalls?: (number | "")[];
}

export interface OpeningEntry {
	name: string;
	width: number | "";
	height: number | "";
	count: number | "";
}

// ─── Factory Helpers ─────────────────────────────────────────────────

/**
 * Create a new room entry.
 * @param index  1-based room number
 * @param prefix Label prefix (e.g. "غ" for interior, "و" for facade)
 */
export function createRoom(index: number, prefix = "غ"): RoomEntry {
	return {
		name: `${prefix}${index}`,
		shape: "rectangular",
		wall1: "",
		wall2: "",
		heightOverride: null,
	};
}

/**
 * Create a new door opening entry.
 */
export function createDoor(index: number): OpeningEntry {
	return { name: `ب${index}`, width: "", height: 2.1, count: 1 };
}

/**
 * Create a new window opening entry.
 */
export function createWindow(index: number): OpeningEntry {
	return { name: `ش${index}`, width: "", height: 1.2, count: 1 };
}

// ─── Calculation Helpers ─────────────────────────────────────────────

/**
 * Convert a possibly-empty numeric field to a number (empty → 0).
 */
export function numVal(v: number | "" | null | undefined): number {
	return typeof v === "number" ? v : 0;
}

/**
 * Calculate the perimeter of a room.
 *
 * For custom-shaped rooms (plaster), sums all custom wall lengths.
 * For rectangular rooms, returns `(wall1 + wall2) * 2` by default.
 * When `perimeterMode` is `"single"` (used by paint facade/boundary),
 * returns just `wall1`.
 */
export function calcPerimeter(
	r: RoomEntry,
	perimeterMode: "double" | "single" = "double",
): number {
	if (r.shape === "custom" && r.customWalls) {
		return r.customWalls.reduce<number>((s, w) => s + numVal(w), 0);
	}
	if (perimeterMode === "single") {
		return numVal(r.wall1);
	}
	return (numVal(r.wall1) + numVal(r.wall2)) * 2;
}

/**
 * Calculate the wall area for a room.
 * Uses `heightOverride` if set, otherwise falls back to `floorHeight`.
 */
export function calcWallArea(
	r: RoomEntry,
	floorHeight: number,
	perimeterMode: "double" | "single" = "double",
): number {
	const h = r.heightOverride != null ? r.heightOverride : floorHeight;
	return calcPerimeter(r, perimeterMode) * h;
}

/**
 * Calculate the ceiling area of a rectangular room (wall1 * wall2).
 */
export function calcCeilingArea(r: RoomEntry): number {
	return numVal(r.wall1) * numVal(r.wall2);
}

/**
 * Calculate the area of an opening (width * height * count).
 */
export function calcOpeningArea(o: OpeningEntry): number {
	return numVal(o.width) * numVal(o.height) * numVal(o.count);
}

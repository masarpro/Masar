"use client";

import { useEffect, useRef, useState } from "react";
import { useItemUpdate } from "../hooks/useItemUpdate";
import type { QuantityItem } from "../types";

export type EditableField = "primary" | "wastage" | "cost" | "sell";

const parseNumber = (s: string): number | null => {
	const n = Number.parseFloat(s.replace(/,/g, "").trim());
	return Number.isFinite(n) ? Math.max(0, n) : null;
};

const num = (v: unknown) => Number(v ?? 0);

/**
 * Local-state controller for an editable spreadsheet row.
 *
 * Keeps a string per cell so the user's typing isn't clobbered by an
 * in-flight optimistic update. Commits write through useItemUpdate's
 * saveImmediate so each field's persist call is independent.
 */
export function useEditableRow(item: QuantityItem) {
	const { saveImmediate, isLoading } = useItemUpdate(item);
	const focusedRef = useRef<EditableField | null>(null);
	const [errorField, setErrorField] = useState<EditableField | null>(null);

	const [primaryStr, setPrimaryStr] = useState(() =>
		String(num(item.primaryValue)),
	);
	const [wastageStr, setWastageStr] = useState(() =>
		String(num(item.wastagePercent)),
	);
	const [costStr, setCostStr] = useState(() =>
		String(num(item.materialUnitPrice)),
	);
	const [sellStr, setSellStr] = useState(() =>
		String(num(item.sellUnitPrice)),
	);

	useEffect(() => {
		if (focusedRef.current !== "primary")
			setPrimaryStr(String(num(item.primaryValue)));
	}, [item.primaryValue]);
	useEffect(() => {
		if (focusedRef.current !== "wastage")
			setWastageStr(String(num(item.wastagePercent)));
	}, [item.wastagePercent]);
	useEffect(() => {
		if (focusedRef.current !== "cost")
			setCostStr(String(num(item.materialUnitPrice)));
	}, [item.materialUnitPrice]);
	useEffect(() => {
		if (focusedRef.current !== "sell")
			setSellStr(String(num(item.sellUnitPrice)));
	}, [item.sellUnitPrice]);

	const setStr = (field: EditableField, v: string) => {
		if (field === "primary") setPrimaryStr(v);
		else if (field === "wastage") setWastageStr(v);
		else if (field === "cost") setCostStr(v);
		else setSellStr(v);
	};

	const focus = (field: EditableField, v: string) => {
		focusedRef.current = field;
		setStr(field, v);
	};

	const revert = (field: EditableField) => {
		focusedRef.current = null;
		const original =
			field === "primary"
				? num(item.primaryValue)
				: field === "wastage"
					? num(item.wastagePercent)
					: field === "cost"
						? num(item.materialUnitPrice)
						: num(item.sellUnitPrice);
		setStr(field, String(original));
		setErrorField(null);
	};

	const commit = (
		field: EditableField,
		raw: string,
		original: number,
		buildOverride: (v: number) => Record<string, unknown>,
	) => {
		focusedRef.current = null;
		const parsed = parseNumber(raw);
		if (parsed === null) {
			setErrorField(field);
			setStr(field, String(original));
			return;
		}
		setErrorField(null);
		if (parsed === original) return;
		try {
			void saveImmediate(buildOverride(parsed));
		} catch {
			setErrorField(field);
		}
	};

	return {
		primaryStr,
		wastageStr,
		costStr,
		sellStr,
		errorField,
		isLoading,
		focus,
		revert,
		commit,
	};
}

export function exportTableToCsv<T extends Record<string, unknown>>(
	data: T[],
	columns: { key: keyof T; label: string }[],
	filename: string,
) {
	// BOM for Arabic support in Excel
	const BOM = "\uFEFF";

	const headers = columns.map((c) => c.label).join(",");

	const rows = data.map((row) =>
		columns
			.map((c) => {
				const val = row[c.key];
				const str = val?.toString() ?? "";
				return str.includes(",") || str.includes('"')
					? `"${str.replace(/"/g, '""')}"`
					: str;
			})
			.join(","),
	);

	const csv = BOM + [headers, ...rows].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}

"use client";

import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { ChevronDown, FileDown, FileSpreadsheet, Printer } from "lucide-react";

interface BOQExportDropdownProps {
	onExcelExport: () => void;
	onPrint: () => void;
	label?: string;
}

export function BOQExportDropdown({
	onExcelExport,
	onPrint,
	label = "تصدير التقرير",
}: BOQExportDropdownProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="print:hidden">
					<FileDown className="h-4 w-4 ml-2" />
					{label}
					<ChevronDown className="h-3 w-3 mr-1 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-[160px]">
				<DropdownMenuItem onClick={onPrint}>
					<FileDown className="h-4 w-4 ml-2" />
					تحميل PDF
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onPrint}>
					<Printer className="h-4 w-4 ml-2" />
					طباعة
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onExcelExport}>
					<FileSpreadsheet className="h-4 w-4 ml-2" />
					تصدير Excel
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

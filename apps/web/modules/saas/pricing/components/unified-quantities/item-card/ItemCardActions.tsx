"use client";

import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";

interface Props {
	itemId: string;
	organizationId: string;
	onDelete: (data: { id: string; organizationId: string }) => Promise<unknown>;
	onDuplicate: (data: {
		id: string;
		organizationId: string;
	}) => Promise<unknown>;
}

export function ItemCardActions({
	itemId,
	organizationId,
	onDelete,
	onDuplicate,
}: Props) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 p-0"
					aria-label="إجراءات البند"
				>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() => onDuplicate({ id: itemId, organizationId })}
				>
					<Copy className="me-2 h-4 w-4" />
					نسخ البند
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => onDelete({ id: itemId, organizationId })}
					className="text-destructive focus:text-destructive"
				>
					<Trash2 className="me-2 h-4 w-4" />
					حذف البند
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

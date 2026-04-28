import { Card } from "@ui/components/card";
import { AlertCircle } from "lucide-react";

interface Props {
	error: { message?: string } | Error | null;
}

export function ErrorState({ error }: Props) {
	const msg =
		error && "message" in error && error.message
			? error.message
			: "خطأ غير معروف";
	return (
		<Card className="flex flex-col items-center gap-3 p-8 text-center">
			<AlertCircle className="h-10 w-10 text-destructive" />
			<h3 className="text-lg font-semibold">حدث خطأ في تحميل البيانات</h3>
			<p className="text-sm text-muted-foreground">{msg}</p>
		</Card>
	);
}

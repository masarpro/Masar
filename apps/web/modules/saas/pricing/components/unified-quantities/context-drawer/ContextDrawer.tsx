"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@ui/components/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { useUnifiedContext } from "../hooks/useContext";
import { GeneralContextForm } from "./GeneralContextForm";
import { OpeningsManager } from "./OpeningsManager";
import { SpacesManager } from "./SpacesManager";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	costStudyId: string;
	organizationId: string;
}

export function ContextDrawer({
	open,
	onOpenChange,
	costStudyId,
	organizationId,
}: Props) {
	const {
		context,
		updateContext,
		upsertSpace,
		deleteSpace,
		upsertOpening,
		deleteOpening,
	} = useUnifiedContext({ costStudyId, organizationId });

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				className="flex h-[85vh] flex-col gap-4 px-4 pb-4"
			>
				<SheetHeader className="px-0">
					<SheetTitle>السياق المشترك</SheetTitle>
				</SheetHeader>

				<Tabs
					defaultValue="general"
					className="flex flex-1 flex-col overflow-hidden"
				>
					<TabsList className="w-full">
						<TabsTrigger value="general" className="flex-1">
							عام
						</TabsTrigger>
						<TabsTrigger value="spaces" className="flex-1">
							الغرف
						</TabsTrigger>
						<TabsTrigger value="openings" className="flex-1">
							الفتحات
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="general"
						className="mt-3 flex-1 overflow-y-auto pe-2"
					>
						<GeneralContextForm
							costStudyId={costStudyId}
							organizationId={organizationId}
							context={context}
							updateContext={(input) => updateContext(input as never)}
						/>
					</TabsContent>

					<TabsContent
						value="spaces"
						className="mt-3 flex-1 overflow-y-auto pe-2"
					>
						<SpacesManager
							costStudyId={costStudyId}
							organizationId={organizationId}
							spaces={context?.spaces ?? []}
							onUpsert={(input) => upsertSpace(input as never)}
							onDelete={(input) => deleteSpace(input as never)}
						/>
					</TabsContent>

					<TabsContent
						value="openings"
						className="mt-3 flex-1 overflow-y-auto pe-2"
					>
						<OpeningsManager
							costStudyId={costStudyId}
							organizationId={organizationId}
							openings={context?.openings ?? []}
							onUpsert={(input) => upsertOpening(input as never)}
							onDelete={(input) => deleteOpening(input as never)}
						/>
					</TabsContent>
				</Tabs>
			</SheetContent>
		</Sheet>
	);
}

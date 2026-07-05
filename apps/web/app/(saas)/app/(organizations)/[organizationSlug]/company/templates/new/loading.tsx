import { EditorPageSkeleton } from "@saas/shared/components/skeletons";

// This route redirects to settings/templates/new — show the destination's skeleton to avoid a flash-then-morph.
export default function Loading() {
	return <EditorPageSkeleton />;
}

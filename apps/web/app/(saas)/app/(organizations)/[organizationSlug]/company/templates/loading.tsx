import { CardGridSkeleton } from "@saas/shared/components/skeletons";

// This route redirects to settings/templates — show the destination's skeleton to avoid a flash-then-morph.
export default function Loading() {
	return <CardGridSkeleton />;
}

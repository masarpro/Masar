import { DashboardSkeleton } from "@saas/shared/components/skeletons";

// This route redirects to company/hr — show the destination's skeleton to avoid a flash-then-morph.
export default function Loading() {
	return <DashboardSkeleton />;
}

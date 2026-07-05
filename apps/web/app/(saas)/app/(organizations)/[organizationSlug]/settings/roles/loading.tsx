import { MembersSettingsSkeleton } from "@saas/shared/components/skeletons";

// This route redirects to settings/members — show the destination's skeleton to avoid a flash-then-morph.
export default function Loading() {
	return <MembersSettingsSkeleton />;
}

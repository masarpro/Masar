import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export default function Loading() {
	return <ListTableSkeleton rows={8} cols={7} />;
}

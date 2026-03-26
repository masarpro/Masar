import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export default function Loading() {
	return <ListTableSkeleton rows={10} cols={5} />;
}

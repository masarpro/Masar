import { AccountDisabledNotice } from "@saas/auth/components/AccountDisabledNotice";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return {
		title: "الحساب معطّل",
	};
}

export default function AccountDisabledPage() {
	return <AccountDisabledNotice />;
}

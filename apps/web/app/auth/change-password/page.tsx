import { ChangePasswordForm } from "@saas/auth/components/ChangePasswordForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return {
		title: "تغيير كلمة المرور",
	};
}

export default function ChangePasswordPage() {
	return <ChangePasswordForm />;
}

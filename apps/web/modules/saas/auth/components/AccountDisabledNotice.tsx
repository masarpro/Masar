"use client";

import { authClient } from "@repo/auth/client";
import { Alert, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import { ShieldXIcon } from "lucide-react";

export function AccountDisabledNotice() {
	const onSignOut = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = "/auth/login";
				},
			},
		});
	};

	return (
		<div dir="rtl">
			<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
				<ShieldXIcon className="size-6 text-destructive" />
			</div>
			<h1 className="font-bold text-xl md:text-2xl">الحساب معطّل</h1>
			<p className="mt-1 mb-6 text-foreground/60">
				تم تعطيل حسابك من قبل مدير المنظمة.
			</p>
			<Alert variant="error" className="mb-6">
				<AlertTitle>
					لا يمكنك الوصول للمنصة حالياً. تواصل مع مدير المنظمة لإعادة
					تفعيل حسابك.
				</AlertTitle>
			</Alert>
			<Button onClick={onSignOut} variant="outline" className="w-full">
				تسجيل الخروج
			</Button>
		</div>
	);
}

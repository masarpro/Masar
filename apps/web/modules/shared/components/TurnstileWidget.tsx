"use client";

import {
	Turnstile,
	type TurnstileInstance,
} from "@marsidev/react-turnstile";
import { forwardRef, useEffect } from "react";

interface TurnstileWidgetProps {
	onVerify: (token: string) => void;
	onError?: () => void;
	onExpire?: () => void;
}

export const TurnstileWidget = forwardRef<
	TurnstileInstance | undefined,
	TurnstileWidgetProps
>(function TurnstileWidget({ onVerify, onError, onExpire }, ref) {
	const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

	// Dev bypass — no key configured
	useEffect(() => {
		if (!siteKey && process.env.NODE_ENV === "development") {
			const timer = setTimeout(() => onVerify("dev-bypass-token"), 100);
			return () => clearTimeout(timer);
		}
	}, [siteKey, onVerify]);

	if (!siteKey) {
		return null;
	}

	return (
		<Turnstile
			ref={ref}
			siteKey={siteKey}
			onSuccess={onVerify}
			onError={() => onError?.()}
			onExpire={() => onExpire?.()}
			options={{
				theme: "auto",
				size: "flexible",
				language: "ar",
			}}
		/>
	);
});

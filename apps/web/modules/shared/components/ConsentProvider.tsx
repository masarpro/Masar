"use client";

import Cookies from "js-cookie";
import { createContext, useState } from "react";

export const ConsentContext = createContext<{
	/** المستخدم اتخذ قراراً (قبول أو رفض) — الشريط يختفي في الحالتين */
	userHasConsented: boolean;
	/** القرار نفسه: قبل الكوكيز غير الضرورية؟ */
	cookiesAllowed: boolean;
	allowCookies: () => void;
	declineCookies: () => void;
}>({
	userHasConsented: false,
	cookiesAllowed: false,
	allowCookies: () => {},
	declineCookies: () => {},
});

export function ConsentProvider({
	children,
	initialConsent,
}: {
	children: React.ReactNode;
	/** true = قبِل، false = رفض، undefined/null = لم يقرر بعد */
	initialConsent?: boolean | null;
}) {
	// كان الرفض يخزّن consent=false لكنه يُبقي الشريط ظاهراً للأبد لأن الحالة
	// كانت "هل وافق؟" بدل "هل قرر؟". نتتبع القرار (ثلاثي القيم) بدلاً من ذلك.
	// عند غياب initialConsent نقرأ الكوكي على العميل — قراءتها على الخادم عبر
	// cookies() كانت تجعل كل صفحات التسويق ديناميكية (بلا كاش CDN). لا يحدث
	// hydration mismatch لأن ConsentBanner لا يعرض شيئاً قبل mount.
	const [choice, setChoice] = useState<boolean | null>(() => {
		if (initialConsent !== undefined && initialConsent !== null) {
			return initialConsent;
		}
		if (typeof document === "undefined") {
			return null;
		}
		const cookie = Cookies.get("consent");
		if (cookie === "true") return true;
		if (cookie === "false") return false;
		return null;
	});

	const allowCookies = () => {
		Cookies.set("consent", "true", { expires: 30 });
		setChoice(true);
	};

	const declineCookies = () => {
		Cookies.set("consent", "false", { expires: 30 });
		setChoice(false);
	};

	return (
		<ConsentContext.Provider
			value={{
				userHasConsented: choice !== null,
				cookiesAllowed: choice === true,
				allowCookies,
				declineCookies,
			}}
		>
			{children}
		</ConsentContext.Provider>
	);
}

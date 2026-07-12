"use client";

import { cn } from "@ui/lib";
import { Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useAssistant } from "./AssistantProvider";

const HINT_STORAGE_KEY = "masar-assistant-hint-seen";
const HINT_DURATION_MS = 8000;

export function FloatingAssistantButton() {
	const { isOpen, toggle, unreadCount } = useAssistant();
	const t = useTranslations("assistant");
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [showHint, setShowHint] = useState(false);

	// تلميح «اسأل مسار عن مشاريعك» عند أول زيارة فقط — يختفي تلقائياً
	// أو عند فتح المساعد، ولا يظهر مرة أخرى بعدها.
	useEffect(() => {
		try {
			if (localStorage.getItem(HINT_STORAGE_KEY)) return;
			setShowHint(true);
			localStorage.setItem(HINT_STORAGE_KEY, "1");
			const timer = setTimeout(
				() => setShowHint(false),
				HINT_DURATION_MS,
			);
			return () => clearTimeout(timer);
		} catch {
			// localStorage not available
		}
	}, []);

	useEffect(() => {
		if (isOpen) setShowHint(false);
	}, [isOpen]);

	return (
		<>
			{showHint && !isOpen && (
				<div className="fixed bottom-[92px] md:bottom-[52px] start-6 z-[60] max-w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-bottom-2 duration-500">
					<div className="relative rounded-xl border border-border/50 bg-popover px-3 py-2 text-xs font-medium text-popover-foreground shadow-lg">
						{t("hint")}
						<button
							type="button"
							aria-label={t("close")}
							onClick={() => setShowHint(false)}
							className="ms-2 inline-flex align-middle text-muted-foreground hover:text-foreground rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<X size={12} />
						</button>
					</div>
				</div>
			)}

			<button
				ref={buttonRef}
				type="button"
				onClick={toggle}
				aria-label={t("title")}
				aria-expanded={isOpen}
				aria-controls="assistant-panel"
				aria-haspopup="dialog"
				title={`${t("hint")} (${t("shortcut")})`}
				className={cn(
					"fixed bottom-20 md:bottom-6 start-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				)}
			>
				<span
					className={cn(
						"transition-transform duration-300",
						isOpen ? "rotate-180" : "rotate-0",
					)}
				>
					{isOpen ? <X size={24} /> : <Sparkles size={24} />}
				</span>

				{/* Unread badge */}
				{unreadCount > 0 && !isOpen && (
					<span className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-in zoom-in-50">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>
		</>
	);
}

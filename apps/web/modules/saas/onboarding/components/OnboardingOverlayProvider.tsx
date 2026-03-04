"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type PropsWithChildren,
} from "react";

const STORAGE_KEY = "onboarding-dismissed";
const REMINDER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface OnboardingOverlayContextValue {
	isModalOpen: boolean;
	showReminder: boolean;
	openModal: () => void;
	dismissModal: () => void;
}

const OnboardingOverlayContext =
	createContext<OnboardingOverlayContextValue | null>(null);

export function useOnboardingOverlay() {
	const ctx = useContext(OnboardingOverlayContext);
	if (!ctx) {
		throw new Error(
			"useOnboardingOverlay must be used within OnboardingOverlayProvider",
		);
	}
	return ctx;
}

export function OnboardingOverlayProvider({
	children,
}: PropsWithChildren) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDismissed, setIsDismissed] = useState(false);
	const [showReminder, setShowReminder] = useState(false);
	const reminderTimer = useRef<ReturnType<typeof setInterval> | null>(null);

	// On mount: check sessionStorage and auto-open if not dismissed
	useEffect(() => {
		const dismissed = sessionStorage.getItem(STORAGE_KEY) === "true";
		if (dismissed) {
			setIsDismissed(true);
		} else {
			setIsModalOpen(true);
		}
	}, []);

	// Start reminder timer when dismissed
	useEffect(() => {
		if (isDismissed && !isModalOpen) {
			reminderTimer.current = setInterval(() => {
				setShowReminder(true);
				// Auto-hide after 5 seconds
				setTimeout(() => setShowReminder(false), 5000);
			}, REMINDER_INTERVAL_MS);
		}

		return () => {
			if (reminderTimer.current) {
				clearInterval(reminderTimer.current);
				reminderTimer.current = null;
			}
		};
	}, [isDismissed, isModalOpen]);

	const openModal = useCallback(() => {
		setIsModalOpen(true);
		setShowReminder(false);
		setIsDismissed(false);
		sessionStorage.removeItem(STORAGE_KEY);
	}, []);

	const dismissModal = useCallback(() => {
		setIsModalOpen(false);
		setIsDismissed(true);
		sessionStorage.setItem(STORAGE_KEY, "true");
	}, []);

	return (
		<OnboardingOverlayContext.Provider
			value={{ isModalOpen, showReminder, openModal, dismissModal }}
		>
			{children}
		</OnboardingOverlayContext.Provider>
	);
}

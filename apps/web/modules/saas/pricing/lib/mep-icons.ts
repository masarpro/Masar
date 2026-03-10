import {
	Zap,
	Droplets,
	Wind,
	Flame,
	Wifi,
	Settings,
} from "lucide-react";

export const MEP_ICON_MAP: Record<
	string,
	React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
	Zap,
	Droplets,
	Wind,
	Flame,
	Wifi,
	Settings,
};

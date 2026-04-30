import { Badge } from "@ui/components/badge";
import { DOMAIN_STYLES, type Domain } from "../types";

interface Props {
	domain: Domain | string;
	className?: string;
}

export function DomainBadge({ domain, className }: Props) {
	const style = DOMAIN_STYLES[domain as Domain];
	if (!style) return <Badge variant="outline">{domain}</Badge>;

	return (
		<Badge
			variant="outline"
			className={className}
			style={{
				color: style.color,
				backgroundColor: style.bgColor,
				borderColor: style.color + "40",
			}}
		>
			{style.label}
		</Badge>
	);
}

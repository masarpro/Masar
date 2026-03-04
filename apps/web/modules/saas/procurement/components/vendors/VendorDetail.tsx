"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Building2, Phone, Mail, MapPin, FileText, Hash } from "lucide-react";

interface VendorDetailProps {
	organizationId: string;
	organizationSlug: string;
	vendorId: string;
}

const VENDOR_TYPE_COLORS: Record<string, string> = {
	SUPPLIER: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	SUBCONTRACTOR_VENDOR: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400",
	EQUIPMENT_VENDOR: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	SERVICE_VENDOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
};

export function VendorDetail({ organizationId, organizationSlug, vendorId }: VendorDetailProps) {
	const t = useTranslations();

	const { data: vendor, isLoading } = useQuery(
		orpc.procurement.vendors.getById.queryOptions({
			input: { organizationId, vendorId },
		}),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (!vendor) return null;

	return (
		<div className="space-y-6">
			{/* Main Info */}
			<Card className="rounded-2xl">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-primary/10 rounded-xl">
								<Building2 className="h-6 w-6 text-primary" />
							</div>
							<div>
								<CardTitle>{vendor.name}</CardTitle>
								<div className="flex items-center gap-2 mt-1">
									<Badge variant="outline" className="rounded-lg font-mono">{vendor.code}</Badge>
									<Badge className={`rounded-lg border-0 ${VENDOR_TYPE_COLORS[vendor.type] ?? ""}`}>
										{t(`procurement.vendorTypes.${vendor.type}`)}
									</Badge>
								</div>
							</div>
						</div>
						{vendor.rating && (
							<div className="text-lg font-semibold">{Number(vendor.rating)}/5</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{vendor.contactPerson && (
							<div className="flex items-center gap-2 text-sm">
								<Building2 className="h-4 w-4 text-muted-foreground" />
								<span>{vendor.contactPerson}</span>
							</div>
						)}
						{vendor.phone && (
							<div className="flex items-center gap-2 text-sm">
								<Phone className="h-4 w-4 text-muted-foreground" />
								<span dir="ltr">{vendor.phone}</span>
							</div>
						)}
						{vendor.email && (
							<div className="flex items-center gap-2 text-sm">
								<Mail className="h-4 w-4 text-muted-foreground" />
								<span dir="ltr">{vendor.email}</span>
							</div>
						)}
						{vendor.address && (
							<div className="flex items-center gap-2 text-sm">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span>{vendor.address}</span>
							</div>
						)}
						{vendor.taxNumber && (
							<div className="flex items-center gap-2 text-sm">
								<Hash className="h-4 w-4 text-muted-foreground" />
								<span dir="ltr">{t("procurement.taxNumber")}: {vendor.taxNumber}</span>
							</div>
						)}
						{vendor.crNumber && (
							<div className="flex items-center gap-2 text-sm">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span dir="ltr">{t("procurement.crNumber")}: {vendor.crNumber}</span>
							</div>
						)}
					</div>
					{vendor.notes && (
						<div className="mt-4 p-3 bg-muted rounded-xl text-sm">
							{vendor.notes}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

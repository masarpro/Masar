"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { VendorForm } from "./VendorForm";

interface EditVendorWrapperProps {
	organizationId: string;
	organizationSlug: string;
	vendorId: string;
}

export function EditVendorWrapper({ organizationId, organizationSlug, vendorId }: EditVendorWrapperProps) {
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
		<VendorForm
			organizationId={organizationId}
			organizationSlug={organizationSlug}
			initialData={{
				id: vendor.id,
				name: vendor.name,
				type: vendor.type,
				contactPerson: vendor.contactPerson,
				phone: vendor.phone,
				email: vendor.email,
				address: vendor.address,
				taxNumber: vendor.taxNumber,
				crNumber: vendor.crNumber,
				categories: vendor.categories,
				notes: vendor.notes,
			}}
		/>
	);
}

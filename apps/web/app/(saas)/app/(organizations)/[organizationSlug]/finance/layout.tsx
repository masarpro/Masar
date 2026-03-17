import type { PropsWithChildren } from "react";

export default function FinanceLayout({ children }: PropsWithChildren) {
	return <div className="px-4 md:px-6 lg:px-8 py-6">{children}</div>;
}

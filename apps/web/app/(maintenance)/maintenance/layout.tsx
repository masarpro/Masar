import type { PropsWithChildren } from "react";

// Self-contained document for the maintenance page: no session, no i18n, no
// providers — it must render even while the database is being migrated.
export default function MaintenanceLayout({ children }: PropsWithChildren) {
	return (
		<html lang="ar" dir="rtl" suppressHydrationWarning>
			<body
				style={{
					margin: 0,
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#0b0b0e",
					color: "#fafafa",
					fontFamily:
						"'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
				}}
			>
				{children}
			</body>
		</html>
	);
}

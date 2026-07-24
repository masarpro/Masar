export const metadata = {
	title: "صيانة مجدولة | مسار",
};

// Static, dependency-free maintenance notice shown while MAINTENANCE_MODE=1
// (database migration cutover). Keep this page free of any DB/session/i18n
// imports — it must work with the database offline.
export default function MaintenancePage() {
	return (
		<main style={{ textAlign: "center", padding: "2rem", maxWidth: 480 }}>
			<div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛠️</div>
			<h1 style={{ fontSize: "1.5rem", margin: "0 0 0.75rem" }}>
				صيانة مجدولة
			</h1>
			<p style={{ color: "#a1a1aa", lineHeight: 1.8, margin: 0 }}>
				نقوم حالياً بترقية بنية مسار التحتية لتصبح أسرع.
				<br />
				سنعود خلال أقل من ساعة — بياناتك آمنة بالكامل.
			</p>
		</main>
	);
}

import { Client } from "pg";

async function trySeq(label: string, connectionString: string, n: number) {
	let ok = 0;
	let fail = 0;
	let lastErr = "";
	for (let i = 1; i <= n; i++) {
		const c = new Client({ connectionString, connectionTimeoutMillis: 8000 });
		try {
			await c.connect();
			await c.query("select 1");
			ok++;
		} catch (e: any) {
			fail++;
			lastErr = e.message;
		} finally {
			await c.end().catch(() => {});
		}
	}
	console.log(`${label}: ok=${ok}/${n}${fail ? ` — last: ${lastErr}` : ""}`);
}

async function main() {
	const url = process.env.DATABASE_URL!;
	await trySeq("pooler:5432", url, 8);
	await trySeq("pooler:6543", url.replace(":5432/", ":6543/"), 8);
	process.exit(0);
}

main();

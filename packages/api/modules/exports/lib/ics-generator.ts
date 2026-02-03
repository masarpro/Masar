// ═══════════════════════════════════════════════════════════════════════════
// ICS Calendar Generator (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ICS Event structure
 */
export interface ICSEvent {
	uid: string;
	summary: string;
	description?: string;
	dtstart: Date;
	dtend?: Date;
	allDay?: boolean;
	location?: string;
	organizer?: { name: string; email?: string };
	categories?: string[];
	status?: "TENTATIVE" | "CONFIRMED" | "CANCELLED";
	priority?: number;
	url?: string;
}

/**
 * ICS Calendar structure
 */
export interface ICSCalendar {
	name: string;
	description?: string;
	timezone?: string;
	events: ICSEvent[];
}

/**
 * Format date to ICS format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date, allDay = false): string {
	const pad = (n: number) => n.toString().padStart(2, "0");

	const year = date.getUTCFullYear();
	const month = pad(date.getUTCMonth() + 1);
	const day = pad(date.getUTCDate());

	if (allDay) {
		return `${year}${month}${day}`;
	}

	const hours = pad(date.getUTCHours());
	const minutes = pad(date.getUTCMinutes());
	const seconds = pad(date.getUTCSeconds());

	return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters in ICS text
 */
function escapeICS(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\n/g, "\\n");
}

/**
 * Fold long lines (ICS spec requires lines < 75 chars)
 */
function foldLine(line: string): string {
	const maxLen = 75;
	if (line.length <= maxLen) return line;

	const result: string[] = [];
	let current = line;

	while (current.length > maxLen) {
		result.push(current.substring(0, maxLen));
		current = " " + current.substring(maxLen);
	}
	result.push(current);

	return result.join("\r\n");
}

/**
 * Generate ICS event string
 */
function generateEvent(event: ICSEvent): string {
	const lines: string[] = [];

	lines.push("BEGIN:VEVENT");
	lines.push(`UID:${event.uid}`);
	lines.push(`DTSTAMP:${formatICSDate(new Date())}`);

	if (event.allDay) {
		lines.push(`DTSTART;VALUE=DATE:${formatICSDate(event.dtstart, true)}`);
		if (event.dtend) {
			lines.push(`DTEND;VALUE=DATE:${formatICSDate(event.dtend, true)}`);
		}
	} else {
		lines.push(`DTSTART:${formatICSDate(event.dtstart)}`);
		if (event.dtend) {
			lines.push(`DTEND:${formatICSDate(event.dtend)}`);
		}
	}

	lines.push(`SUMMARY:${escapeICS(event.summary)}`);

	if (event.description) {
		lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
	}

	if (event.location) {
		lines.push(`LOCATION:${escapeICS(event.location)}`);
	}

	if (event.organizer) {
		if (event.organizer.email) {
			lines.push(
				`ORGANIZER;CN=${escapeICS(event.organizer.name)}:mailto:${event.organizer.email}`,
			);
		} else {
			lines.push(`ORGANIZER;CN=${escapeICS(event.organizer.name)}:`);
		}
	}

	if (event.categories?.length) {
		lines.push(`CATEGORIES:${event.categories.map(escapeICS).join(",")}`);
	}

	if (event.status) {
		lines.push(`STATUS:${event.status}`);
	}

	if (event.priority !== undefined) {
		lines.push(`PRIORITY:${event.priority}`);
	}

	if (event.url) {
		lines.push(`URL:${event.url}`);
	}

	lines.push("END:VEVENT");

	return lines.map(foldLine).join("\r\n");
}

/**
 * Generate ICS calendar string
 */
export function generateICS(calendar: ICSCalendar): string {
	const lines: string[] = [];

	lines.push("BEGIN:VCALENDAR");
	lines.push("VERSION:2.0");
	lines.push("PRODID:-//Masar//Project Calendar//AR");
	lines.push("CALSCALE:GREGORIAN");
	lines.push("METHOD:PUBLISH");

	if (calendar.name) {
		lines.push(`X-WR-CALNAME:${escapeICS(calendar.name)}`);
	}

	if (calendar.description) {
		lines.push(`X-WR-CALDESC:${escapeICS(calendar.description)}`);
	}

	if (calendar.timezone) {
		lines.push(`X-WR-TIMEZONE:${calendar.timezone}`);
	}

	// Add events
	for (const event of calendar.events) {
		lines.push(generateEvent(event));
	}

	lines.push("END:VCALENDAR");

	return lines.join("\r\n");
}

/**
 * Generate unique event ID
 */
export function generateEventUID(
	type: string,
	id: string,
	organizationId: string,
): string {
	return `${type}-${id}@${organizationId}.masar.app`;
}

import { generateUpdatePDFProcedure } from "./procedures/generate-update-pdf";
import { generateClaimPDFProcedure } from "./procedures/generate-claim-pdf";
import { generateWeeklyReportProcedure } from "./procedures/generate-weekly-report";
import { exportExpensesCsvProcedure } from "./procedures/export-expenses-csv";
import { exportClaimsCsvProcedure } from "./procedures/export-claims-csv";
import { exportIssuesCsvProcedure } from "./procedures/export-issues-csv";
import { generateCalendarICSProcedure } from "./procedures/generate-calendar-ics";

export const exportsRouter = {
	// PDF exports
	generateUpdatePDF: generateUpdatePDFProcedure,
	generateClaimPDF: generateClaimPDFProcedure,
	generateWeeklyReport: generateWeeklyReportProcedure,
	// CSV exports
	exportExpensesCsv: exportExpensesCsvProcedure,
	exportClaimsCsv: exportClaimsCsvProcedure,
	exportIssuesCsv: exportIssuesCsvProcedure,
	// Calendar
	generateCalendarICS: generateCalendarICSProcedure,
};

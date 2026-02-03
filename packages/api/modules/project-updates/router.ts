import { generateUpdateDraft } from "./procedures/generate-update-draft";
import { publishOfficialUpdate } from "./procedures/publish-official-update";

export const projectUpdatesRouter = {
	generateDraft: generateUpdateDraft,
	publish: publishOfficialUpdate,
};

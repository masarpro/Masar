import { createShareLinkProcedure } from "./procedures/create-share-link";
import { listShareLinksProcedure } from "./procedures/list-share-links";
import { revokeShareLinkProcedure } from "./procedures/revoke-share-link";
import { getSharedResourceProcedure } from "./procedures/get-shared-resource";

export const sharesRouter = {
	create: createShareLinkProcedure,
	list: listShareLinksProcedure,
	revoke: revokeShareLinkProcedure,
	getResource: getSharedResourceProcedure,
};

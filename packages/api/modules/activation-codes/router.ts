import { list, create, deactivate, getUsages } from "./procedures/admin";
import { validate, activate } from "./procedures/user";

export const activationCodesRouter = {
	admin: {
		list,
		create,
		deactivate,
		getUsages,
	},
	validate,
	activate,
};

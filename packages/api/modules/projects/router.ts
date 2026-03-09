import { createProjectProcedure } from "./procedures/create-project";
import { deleteProjectProcedure } from "./procedures/delete-project";
import {
	archiveProjectProcedure,
	restoreProjectProcedure,
} from "./procedures/archive-project";
import { getNextProjectNoProcedure } from "./procedures/get-next-project-no";
import { getProject } from "./procedures/get-project";
import { listProjects } from "./procedures/list-projects";
import { updateProjectProcedure } from "./procedures/update-project";

export const projectsRouter = {
	list: listProjects,
	create: createProjectProcedure,
	getById: getProject,
	update: updateProjectProcedure,
	delete: deleteProjectProcedure,
	archive: archiveProjectProcedure,
	restore: restoreProjectProcedure,
	getNextProjectNo: getNextProjectNoProcedure,
};

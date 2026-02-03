import { orpcClient } from "./orpc-client";

// Re-export orpcClient as apiServer for server-side usage
export const apiServer = orpcClient;

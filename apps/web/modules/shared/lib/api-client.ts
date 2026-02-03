import { orpcClient } from "./orpc-client";

// Re-export orpcClient as apiClient for backward compatibility
export const apiClient = orpcClient;

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export const textModel = openai("gpt-4o-mini");
export const imageModel = openai("dall-e-3");
export const audioModel = openai("whisper-1");

export const assistantModel = anthropic("claude-sonnet-4-20250514");

export * from "ai";
export * from "./lib";
export * from "./prompts/assistant-system";
export * from "./tools/assistant-tools";

// Module Registry
export {
  getAllModules,
  getModuleById,
  getModuleByRoute,
  type AIModuleDefinition,
} from "./modules/registry";

// Tool Registry
export {
  registerTool,
  getToolsForModule,
  getAllRegisteredTools,
  getAISDKTools,
  type ToolContext as AIToolContext,
  type AIToolRegistration,
} from "./tools/registry";

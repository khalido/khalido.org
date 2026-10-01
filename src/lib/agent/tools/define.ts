import type { AgentTool } from "@earendil-works/pi-agent-core";
import type { TSchema } from "@earendil-works/pi-ai";

/** Identity helper that types a tool literal as an AgentTool, so `execute`'s params check against the schema. */
export const defineTool = <P extends TSchema, D = any>(tool: AgentTool<P, D>) => tool;

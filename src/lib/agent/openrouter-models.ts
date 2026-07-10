/**
 * Live OpenRouter model list with a 1-hour localStorage cache.
 *
 * pi-ai's getBuiltinModels() is a static registry frozen at the package's
 * release date, so new models (e.g. grok-4.5) never appear. OpenRouter's
 * /models endpoint is public (no key needed); we map it to pi-ai's Model
 * shape, keeping only tool-calling models since the agent needs tools.
 */

import { getBuiltinModels } from "@earendil-works/pi-ai/providers/all";

const CACHE_KEY = "openrouter-models-v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface ORModel {
  id: string;
  name: string;
  api: "openai-completions";
  provider: "openrouter";
  baseUrl: string;
  compat: { supportsDeveloperRole?: boolean; thinkingFormat: "openrouter"; cacheControlFormat?: "anthropic" };
  reasoning: boolean;
  input: string[];
  cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
  contextWindow: number;
  maxTokens: number;
}

/** Picker-friendly subset, used by ModelPicker */
export interface ModelInfo {
  id: string;
  name: string;
  reasoning: boolean;
  costIn: number;
  costOut: number;
  contextWindow: number;
}

export function toModelInfo(m: ORModel): ModelInfo {
  return {
    id: m.id,
    name: m.name,
    reasoning: m.reasoning,
    costIn: m.cost.input,
    costOut: m.cost.output,
    contextWindow: m.contextWindow,
  };
}

/**
 * Tool-calling OpenRouter models, live with a 1h cache. Falls back to pi-ai's
 * builtin (static) registry when the API is unreachable, so it always resolves.
 */
export async function getOpenRouterModels(): Promise<ORModel[]> {
  try {
    return await fetchLiveModels();
  } catch {
    return getBuiltinModels("openrouter") as unknown as ORModel[];
  }
}

/** Look up one model by id from the same cached list. */
export async function getOpenRouterModel(id: string): Promise<ORModel | undefined> {
  const models = await getOpenRouterModels();
  return models.find((m) => m.id === id);
}

async function fetchLiveModels(): Promise<ORModel[]> {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached?.ts && Date.now() - cached.ts < CACHE_TTL_MS && cached.models?.length) {
      return cached.models;
    }
  } catch {
    // corrupt cache — refetch
  }

  const res = await fetch("https://openrouter.ai/api/v1/models");
  if (!res.ok) throw new Error(`OpenRouter models API: ${res.status}`);
  const { data } = await res.json();

  const models: ORModel[] = data
    .filter((m: any) => m.supported_parameters?.includes("tools"))
    .map((m: any) => ({
      id: m.id,
      name: m.name,
      api: "openai-completions" as const,
      provider: "openrouter" as const,
      baseUrl: "https://openrouter.ai/api/v1",
      compat: {
        // supportsDeveloperRole deliberately unset — pi-ai auto-detects it
        // per model family (openai/anthropic ids use the "developer" role)
        thinkingFormat: "openrouter" as const,
        ...(m.id.startsWith("anthropic/") ? { cacheControlFormat: "anthropic" as const } : {}),
      },
      reasoning: m.supported_parameters?.includes("reasoning") ?? false,
      input: m.architecture?.input_modalities?.includes("image") ? ["text", "image"] : ["text"],
      cost: {
        // OpenRouter prices are $/token as strings; pi-ai wants $/M tokens
        input: parseFloat(m.pricing?.prompt ?? "0") * 1e6,
        output: parseFloat(m.pricing?.completion ?? "0") * 1e6,
        cacheRead: 0,
        cacheWrite: 0,
      },
      contextWindow: m.context_length ?? 128_000,
      maxTokens: m.top_provider?.max_completion_tokens ?? 16_000,
    }));

  localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), models }));
  return models;
}

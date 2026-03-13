import { Type } from "@sinclair/typebox";

export const oilEventsTool = {
  name: "get_oil_events",
  label: "Oil Events",
  description:
    "Fetch major historical events that affected oil prices (wars, crises, OPEC decisions). Returns date and event label.",
  parameters: Type.Object({}),
  execute: async (
    _toolCallId: string,
    _params: {},
    signal?: AbortSignal,
  ) => {
    const res = await fetch("/data/oil/events.json", { signal });
    const events = await res.json();
    const text = events.map((e: any) => `${e.date}: ${e.label}`).join("\n");
    return {
      content: [{ type: "text" as const, text }],
      details: { count: events.length },
    };
  },
};

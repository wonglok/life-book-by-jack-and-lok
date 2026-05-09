import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { weatherTool } from "@/mastra/tools";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { Memory } from "@mastra/memory";

import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseekProvider = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

export const AgentState = z.object({
  memories: z
    .array(
      z.object({
        _id: z.string(),
        inspiration: z.string(),
        description: z.string(),
        imageUrl: z.string(),
      }),
    )
    .default([]),
  suggestion: z
    .array(
      z.object({
        _id: z.string(),
        inspiration: z.string(),
        description: z.string(),
        imageUrl: z.string(),
      }),
    )
    .default([]),
});

export type AgentStateType = z.infer<typeof AgentState>;

export const weatherAgent = new Agent({
  id: "weather-agent",
  name: "Weather Agent",
  tools: { weatherTool },
  model: deepseekProvider.languageModel("deepseek-v4-flash"),
  instructions: "You are a helpful assistant.",
  memory: new Memory({
    storage: new LibSQLStore({
      id: "weather-agent-memory",
      url: "file::memory:",
    }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
        scope: "thread",
      },
    },
  }),
});

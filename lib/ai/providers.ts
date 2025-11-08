import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const VENICE_API_KEY = process.env.VENICE_API_KEY || "";
const VENICE_BASE_URL = "https://api.venice.ai/api/v1";

// Venice.ai provider using OpenAI-compatible SDK
const veniceProvider = createOpenAICompatible({
  apiKey: VENICE_API_KEY,
  baseURL: VENICE_BASE_URL,
  name: "venice",
});

// Models that support function calling (tools)
const MODELS_WITH_TOOLS = new Set([
  "chat-model",
  "fastest-model",
  "code-model",
  "vision-model",
  "artifact-model",
]);

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        // Default chat model - Llama 3.3 70B
        "chat-model": veniceProvider.languageModel("llama-3.3-70b"),
        // Reasoning model - DeepSeek R1 with thinking extraction
        "chat-model-reasoning": wrapLanguageModel({
          model: veniceProvider.languageModel("deepseek-r1-671b"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        // Fast model for title generation
        "title-model": veniceProvider.languageModel("llama-3.2-3b"),
        // Artifact generation model
        "artifact-model": veniceProvider.languageModel("llama-3.3-70b"),
        // Fastest model
        "fastest-model": veniceProvider.languageModel("llama-3.2-3b"),
        // Code specialized model
        "code-model": veniceProvider.languageModel("qwen3-235b"),
        // Vision model
        "vision-model": veniceProvider.languageModel("mistral-31-24b"),
        // Uncensored model - no tools
        "uncensored-model": veniceProvider.languageModel("venice-uncensored"),
      },
    });

// Export a helper to check if a model supports tools
export function modelSupportsTools(modelId: string): boolean {
  return MODELS_WITH_TOOLS.has(modelId);
}

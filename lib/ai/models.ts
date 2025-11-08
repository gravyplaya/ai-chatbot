import { unstable_cache as cache } from "next/cache";
export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  modelId?: string;
  trait?: string;
};

// Static model definitions that map to provider language models
export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Default",
    description: "Llama 3.3 70B - Balanced performance for general tasks",
    modelId: "llama-3.3-70b",
    trait: "default",
  },
  {
    id: "fastest-model",
    name: "Fastest",
    description: "Llama 3.2 3B - Ultra-fast responses for simple queries",
    modelId: "llama-3.2-3b",
    trait: "fastest",
  },
  {
    id: "code-model",
    name: "Code",
    description: "Qwen 3 Coder 235B - Optimized for programming tasks",
    modelId: "qwen-3-235b",
    trait: "default_code",
  },
  {
    id: "vision-model",
    name: "Vision",
    description:
      "Mistral 3.1 24B - Advanced vision and multimodal capabilities",
    modelId: "mistral-31-24b",
    trait: "default_vision",
  },
  {
    id: "uncensored-model",
    name: "Uncensored",
    description: "TavonnAI Uncensored - Unrestricted content generation",
    modelId: "venice-uncensored",
  },
  {
    id: "chat-model-reasoning",
    name: "Reasoning",
    description: "DeepSeek R1 671B - Advanced reasoning with chain-of-thought",
    modelId: "deepseek-r1-671b",
    trait: "default_reasoning",
  },
];

// Type for Venice API model response
export interface VeniceModel {
  id: string;
  type: string;
  object: string;
  created: number;
  owned_by: string;
  model_spec: {
    availableContextTokens: number;
    capabilities: {
      optimizedForCode?: boolean;
      quantization?: string;
      supportsFunctionCalling?: boolean;
      supportsReasoning?: boolean;
      supportsResponseSchema?: boolean;
      supportsVision?: boolean;
      supportsWebSearch?: boolean;
      supportsLogProbs?: boolean;
    };
    constraints?: {
      temperature?: {
        default: number;
      };
      top_p?: {
        default: number;
      };
    };
    name: string;
    modelSource?: string;
    offline: boolean;
    pricing?: {
      input: {
        usd: number;
        vcu: number;
        diem: number;
      };
      output: {
        usd: number;
        vcu: number;
        diem: number;
      };
    };
    traits?: string[];
  };
}

export interface VeniceModelsResponse {
  data: VeniceModel[];
  object: string;
  type: string;
}

export interface VeniceTraitsResponse {
  data: {
    default?: string;
    fastest?: string;
    default_code?: string;
    default_vision?: string;
    default_reasoning?: string;
    most_intelligent?: string;
    most_uncensored?: string;
  };
  object: string;
  type: string;
}

/**
 * Fetches available models from Venice API
 * Falls back to static models if API call fails
 */
export async function fetchVeniceModels(): Promise<ChatModel[]> {
  try {
    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      console.warn("VENICE_API_KEY not set, using static models");
      return chatModels;
    }

    const response = await fetch("https://api.venice.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      // Cache for 1 hour
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn("Failed to fetch Venice models, using static models");
      return chatModels;
    }

    const data: VeniceModelsResponse = await response.json();

    // Filter to text models only and map to our ChatModel format
    const textModels = data.data
      .filter((model) => model.type === "text" && !model.model_spec.offline)
      .map((model) => {
        const traits = model.model_spec.traits || [];
        const capabilities = model.model_spec.capabilities;

        let category = "General";
        let description = model.model_spec.name;

        // Determine category and description based on traits and capabilities
        if (traits.includes("fastest")) {
          category = "Fastest";
          description = `${model.model_spec.name} - Ultra-fast responses`;
        } else if (
          traits.includes("default_code") ||
          capabilities.optimizedForCode
        ) {
          category = "Code";
          description = `${model.model_spec.name} - Optimized for programming`;
        } else if (capabilities.supportsVision) {
          category = "Vision";
          description = `${model.model_spec.name} - Vision and multimodal`;
        } else if (traits.includes("most_uncensored")) {
          category = "Uncensored";
          description = `${model.model_spec.name} - Unrestricted generation`;
        } else if (
          traits.includes("default_reasoning") ||
          capabilities.supportsReasoning
        ) {
          category = "Reasoning";
          description = `${model.model_spec.name} - Advanced reasoning`;
        } else if (traits.includes("default")) {
          category = "Default";
          description = `${model.model_spec.name} - Balanced performance`;
        }

        return {
          id: model.id,
          name: category,
          description,
          modelId: model.id,
          trait: traits[0],
        };
      });

    return textModels.length > 0 ? textModels : chatModels;
  } catch (error) {
    console.error("Error fetching Venice models:", error);
    return chatModels;
  }
}

/**
 * Fetches model traits from Venice API
 * Returns mapping of trait names to model IDs
 */
export async function fetchVeniceTraits(): Promise<
  VeniceTraitsResponse["data"]
> {
  try {
    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      return {
        default: "llama-3.3-70b",
        fastest: "llama-3.2-3b",
        default_code: "qwen-2.5-coder-32b",
        default_vision: "mistral-31-24b",
        default_reasoning: "deepseek-r1-671b",
      };
    }

    const response = await fetch("https://api.venice.ai/api/v1/models/traits", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      // Cache for 1 hour
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch traits");
    }

    const data: VeniceTraitsResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching Venice traits:", error);
    return {
      default: "llama-3.3-70b",
      fastest: "llama-3.2-3b",
      default_code: "qwen-2.5-coder-32b",
      default_vision: "mistral-31-24b",
      default_reasoning: "deepseek-r1-671b",
    };
  }
}

export type ImageModel = {
  id: string;
  name: string;
  description: string;
};

/**
 * Fetches available image models from Venice API
 */
export const fetchVeniceImageModels = cache(
  async (): Promise<ImageModel[]> => {
    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      throw new Error("VENICE_API_KEY not set");
    }

    const response = await fetch(
      "https://api.venice.ai/api/v1/models?type=image",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch Venice models: ${response.status} ${errorText}`,
      );
    }

    const data: VeniceModelsResponse = await response.json();
    console.log(data.data);
    const imageModels = data.data
      .filter((model) => model.type === "image" && !model.model_spec.offline)
      .map((model) => ({
        id: model.id,
        name: model.model_spec.name,
        description: "",
      }));

    return imageModels;
  },
  ["venice-image-models"],
  { revalidate: 3600 },
);

export const fetchVeniceImageStyles = cache(
  async (): Promise<string[]> => {
    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      throw new Error("VENICE_API_KEY not set");
    }

    const response = await fetch("https://api.venice.ai/api/v1/image/styles", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch Venice image styles: ${response.status} ${errorText}`,
      );
    }

    const data = await response.json();
    return data.data;
  },
  ["venice-image-styles"],
  { revalidate: 3600 },
);

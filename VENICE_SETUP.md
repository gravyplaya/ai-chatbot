# Venice.ai Setup Guide

This chatbot application uses [Venice.ai](https://venice.ai) as its primary LLM provider. Venice.ai offers privacy-focused, uncensored AI models with advanced features.

## Features

- **Multiple Model Categories**: Dynamically fetched from Venice API
  - **Default**: Llama 3.3 70B - Balanced performance
  - **Fastest**: Llama 3.2 3B - Ultra-fast responses
  - **Code**: Qwen 2.5 Coder 32B - Programming optimized
  - **Vision**: Mistral 3.1 24B - Multimodal capabilities
  - **Uncensored**: Venice Uncensored - Unrestricted generation
  - **Reasoning**: DeepSeek R1 671B - Advanced chain-of-thought

- **Web Search Integration**: Automatic web search with citations
- **Privacy-Focused**: No data retention or training on conversations
- **OpenAI-Compatible**: Easy migration from OpenAI

## Setup

### 1. Get Your API Key

1. Visit [https://venice.ai/api](https://venice.ai/api)
2. Sign up or log in to your account
3. Generate a new API key

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
VENICE_API_KEY=your_api_key_here
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Application

```bash
pnpm dev
```

## Venice-Specific Features

### Web Search

Web search is automatically enabled for most models. The app will:
- Automatically search the web when needed (`enable_web_search: "auto"`)
- Include citations in responses (`enable_web_citations: true`)
- Return structured search results (`return_search_results_as_documents: true`)

### Reasoning Models

Reasoning models like DeepSeek R1 671B support advanced chain-of-thought:
- Thinking blocks are preserved by default
- Can be stripped with `strip_thinking_response: true`
- Thinking process can be disabled with `disable_thinking: true`

### Model Selection

The app dynamically fetches available models from Venice's `/models` endpoint and categorizes them by traits. Models are cached for 1 hour to reduce API calls.

## Configuration Files

### Key Files

- **`lib/ai/providers.ts`**: Venice provider configuration
- **`lib/ai/models.ts`**: Model definitions and dynamic fetching
- **`lib/ai/venice-config.ts`**: Venice-specific parameters
- **`lib/ai/entitlements.ts`**: Model access by user type

### Venice Parameters

Venice.ai supports passing parameters via **model feature suffixes**. Parameters are appended to the model ID:

**Format:** `model-id:param1=value1&param2=value2`

**Example:** `llama-3.3-70b:enable_web_search=on&enable_web_citations=true`

Default parameters are applied to all models in `lib/ai/providers.ts`:

```typescript
// Default suffix for most models
const VENICE_DEFAULT_SUFFIX = 
  ":enable_web_search=auto&enable_web_citations=true&include_venice_system_prompt=true";

// Fast models (no web search for speed)
const VENICE_FAST_SUFFIX = 
  ":enable_web_search=off&include_venice_system_prompt=true&disable_thinking=true";

// Reasoning models (preserve thinking blocks)
const VENICE_REASONING_SUFFIX = 
  ":enable_web_search=auto&enable_web_citations=true&include_venice_system_prompt=true&strip_thinking_response=false";
```

### Customizing Parameters

To modify parameters for a model, update the suffix in `lib/ai/providers.ts`:

```typescript
// Example: Disable web search for uncensored model
"uncensored-model": veniceProvider.languageModel(
  "venice-uncensored:enable_web_search=off&include_venice_system_prompt=true"
),
```

Or use the utility function:

```typescript
import { buildModelFeatureSuffix } from "@/lib/ai/venice-config";

const modelId = buildModelFeatureSuffix("llama-3.3-70b", {
  enable_web_search: "on",
  enable_web_citations: true,
});
// Returns: "llama-3.3-70b:enable_web_search=on&enable_web_citations=true"
```

## API Endpoints Used

- **Chat Completions**: `https://api.venice.ai/api/v1/chat/completions`
- **Models List**: `https://api.venice.ai/api/v1/models`
- **Models Traits**: `https://api.venice.ai/api/v1/models/traits`

## Pricing

Venice.ai uses Diem (API credits) for billing:

| Model Tier | Input (per 1M tokens) | Output (per 1M tokens) |
|-----------|---------------------|---------------------|
| Small (3-4B) | $0.15 / 0.15 Diem | $0.60 / 0.6 Diem |
| Medium (24-32B) | $0.50 / 0.5 Diem | $2.00 / 2.0 Diem |
| Large (70B) | $0.70 / 0.7 Diem | $2.80 / 2.8 Diem |
| X-Large (235-405B) | $1.50 / 1.5 Diem | $6.00 / 6.0 Diem |
| Reasoning (671B) | $3.50 / 3.5 Diem | $14.00 / 14.0 Diem |

Visit [venice.ai/pricing](https://venice.ai/pricing) for current rates.

## Troubleshooting

### API Key Not Working

- Ensure `VENICE_API_KEY` is set in `.env.local`
- Restart the development server after adding the key
- Check your Venice.ai account has sufficient credits

### Models Not Loading

- Check API key permissions
- Verify network connectivity to `api.venice.ai`
- Check console for error messages
- The app falls back to static models if API fetch fails

### Web Search Not Working

- Ensure `enable_web_search` is not set to "off"
- Some models may not support web search (check model capabilities)
- Rate limits may apply to web search features

## Migration from Vercel AI Gateway

This app has been migrated from Vercel AI Gateway to Venice.ai direct API:

- ✅ Removed `@ai-sdk/gateway` dependency
- ✅ Removed `@ai-sdk/xai` dependency
- ✅ Added Venice.ai OpenAI-compatible provider
- ✅ Added Venice-specific parameters support
- ✅ Dynamic model fetching from Venice API
- ✅ Web search and citation features enabled

## Resources

- [Venice.ai Documentation](https://docs.venice.ai)
- [Venice.ai API Reference](https://docs.venice.ai/api-reference)
- [Venice.ai Models](https://docs.venice.ai/overview/models)
- [AI SDK Documentation](https://sdk.vercel.ai)

## Support

- Venice.ai Discord: Join via [venice.ai](https://venice.ai)
- Venice.ai Support: [support@venice.ai](mailto:support@venice.ai)
- GitHub Issues: Report bugs in this repository
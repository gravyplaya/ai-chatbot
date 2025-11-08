# Migration Summary: Vercel AI Gateway → Venice.ai Direct API

This document summarizes the migration from Vercel AI Gateway to Venice.ai direct API integration.

## Overview

The application has been successfully migrated to use Venice.ai as the primary LLM provider, replacing the Vercel AI Gateway setup that was previously routing requests to xAI models.

## Changes Made

### 1. Dependencies

**Removed:**
- `@ai-sdk/gateway` (v1.0.15)
- `@ai-sdk/xai` (v2.0.13)

**Retained:**
- `@ai-sdk/openai-compatible` (v1.0.22) - Used for Venice.ai integration

### 2. Provider Configuration

**File:** `lib/ai/providers.ts`

- Replaced Vercel AI Gateway with Venice.ai OpenAI-compatible provider
- Added Venice.ai base URL: `https://api.venice.ai/api/v1`
- Configured multiple model types with feature suffixes:
  - `chat-model`: llama-3.3-70b:enable_web_search=auto&enable_web_citations=true
  - `fastest-model`: llama-3.2-3b:enable_web_search=auto
  - `code-model`: qwen-2.5-coder-32b:enable_web_search=auto
  - `vision-model`: mistral-31-24b:enable_web_search=auto
  - `uncensored-model`: venice-uncensored:enable_web_search=auto
  - `chat-model-reasoning`: deepseek-r1-671b:enable_web_search=auto&strip_thinking_response=false
  - `title-model`: llama-3.2-3b:enable_web_search=off (fast, no web search)
  - `artifact-model`: llama-3.3-70b:enable_web_search=auto

### 3. Model Configuration

**File:** `lib/ai/models.ts`

- Updated static model definitions with Venice.ai models
- Added `fetchVeniceModels()` function to dynamically fetch available models
- Added `fetchVeniceTraits()` function to get model trait mappings
- Models are cached for 1 hour to reduce API calls
- Falls back to static models if API fetch fails
- Added TypeScript interfaces for Venice API responses

### 4. Venice-Specific Configuration

**New File:** `lib/ai/venice-config.ts`

Created comprehensive Venice.ai configuration including:
- `VeniceParameters` interface for Venice-specific features
- Default parameter sets (documented for reference)
- `buildModelFeatureSuffix()` - Builds model feature suffix strings
- `parseModelId()` - Parses model IDs with feature suffixes
- `getVeniceParameters()` - Returns appropriate parameters by model type
- Venice API endpoint constants
- API key validation utilities

**Note:** Parameters are applied via model feature suffixes (e.g., `model-id:param=value`) rather than request body parameters, as this is the recommended approach for the OpenAI-compatible provider.

### 5. Chat API Integration

**File:** `app/(chat)/api/chat/route.ts`

- Removed Vercel AI Gateway error handling
- Updated error messages for Venice.ai context
- Venice parameters are passed via model feature suffixes (in providers.ts)

### 6. Server Actions

**File:** `app/(chat)/actions.ts`

- No changes needed - Venice parameters handled via model suffixes
- Uses fast model with web search disabled (configured in providers.ts)

### 7. Artifact Handlers

**Files:**
- `artifacts/code/server.ts`
- `artifacts/sheet/server.ts`
- `artifacts/text/server.ts`

All artifact handlers updated to:
- Remove OpenAI-specific `providerOptions` (text artifacts)
- Venice parameters handled via model feature suffixes in providers.ts

### 8. User Entitlements

**File:** `lib/ai/entitlements.ts`

- Updated available model IDs for both guest and regular users
- All users now have access to all 6 model categories:
  - Default (Llama 3.3 70B)
  - Fastest (Llama 3.2 3B)
  - Code (Qwen 2.5 Coder 32B)
  - Vision (Mistral 3.1 24B)
  - Uncensored (Venice Uncensored)
  - Reasoning (DeepSeek R1 671B)

### 9. Error Handling

**File:** `lib/errors.ts`

- Removed `activate_gateway` error surface
- Removed gateway-specific error messages
- Simplified error handling for direct API calls

### 10. Documentation

**Updated Files:**
- `README.md` - Updated model provider section, removed gateway references
- `VENICE_SETUP.md` - New comprehensive setup guide
- `MIGRATION_SUMMARY.md` - This document

## Environment Variables

### Required

```bash
VENICE_API_KEY=your_venice_api_key_here
```

Get your API key at: https://venice.ai/api

### Removed

- `AI_GATEWAY_API_KEY` - No longer needed

## Venice.ai Features Enabled

### Web Search
- **Enabled by default** with `enable_web_search: "auto"`
- Automatically searches web when needed
- Includes citations in responses
- Returns structured search results

### Model-Specific Features

Parameters are passed via **model feature suffixes** in the format: `model-id:param1=value1&param2=value2`

**Reasoning Models (DeepSeek R1):**
- Chain-of-thought reasoning preserved
- Thinking blocks visible to users
- Configured with: `:enable_web_search=auto&strip_thinking_response=false`

**Vision Models (Mistral 3.1):**
- Multimodal input support
- Image understanding capabilities
- Configured with standard web search parameters

**Fast Models (Llama 3.2 3B):**
- Web search disabled for speed: `:enable_web_search=off`
- Optimized for quick responses
- Used for title generation

## API Endpoints Used

1. **Chat Completions:** `POST /api/v1/chat/completions`
2. **Models List:** `GET /api/v1/models` (optional, cached)
3. **Models Traits:** `GET /api/v1/models/traits` (optional, cached)

## Breaking Changes

### For Users
- No breaking changes - UI and UX remain the same
- Model selection now shows Venice.ai models instead of xAI models
- Additional model options available (fastest, code, vision, uncensored)

### For Developers
- Must set `VENICE_API_KEY` environment variable
- Remove `AI_GATEWAY_API_KEY` if previously set
- Gateway-specific error handling removed
- Venice parameters are passed via model feature suffixes, not request body
- Model IDs include parameter suffixes (e.g., `llama-3.3-70b:enable_web_search=auto`)

## Rollback Instructions

If rollback is needed:

1. Restore removed dependencies:
   ```bash
   pnpm add @ai-sdk/gateway@^1.0.15 @ai-sdk/xai@2.0.13
   ```

2. Revert files using git:
   ```bash
   git checkout HEAD~1 -- lib/ai/providers.ts
   git checkout HEAD~1 -- lib/ai/models.ts
   git checkout HEAD~1 -- lib/errors.ts
   git checkout HEAD~1 -- app/(chat)/api/chat/route.ts
   ```

3. Remove Venice-specific files:
   ```bash
   rm lib/ai/venice-config.ts
   rm VENICE_SETUP.md
   rm MIGRATION_SUMMARY.md
   ```

4. Update environment variables back to `AI_GATEWAY_API_KEY`

## Testing Recommendations

1. **Basic Chat:** Test sending messages with different models
2. **Web Search:** Ask questions requiring current information
3. **Reasoning:** Test complex problems with reasoning model
4. **Vision:** Test image input capabilities
5. **Code Generation:** Test programming tasks with code model
6. **Title Generation:** Verify chat titles are generated correctly
7. **Artifacts:** Test creating and updating documents/code/sheets

## Performance Notes

- Model list is cached for 1 hour
- Falls back to static models if API unavailable
- Web search adds slight latency but provides current information
- Fast models (3B) are significantly quicker than large models (70B+)

## Cost Considerations

Venice.ai pricing (per 1M tokens):

| Model | Input | Output |
|-------|-------|--------|
| Llama 3.2 3B (Fastest) | $0.15 | $0.60 |
| Qwen 2.5 Coder 32B | $0.50 | $2.00 |
| Venice Uncensored | $0.50 | $2.00 |
| Llama 3.3 70B (Default) | $0.70 | $2.80 |
| Mistral 3.1 24B (Vision) | $0.50 | $2.00 |
| DeepSeek R1 671B (Reasoning) | $3.50 | $14.00 |

**Cost Optimization Tips:**
- Use fastest model for simple queries
- Default model for general chat
- Reasoning model only for complex problems
- Monitor usage via Venice.ai dashboard

## Support Resources

- **Venice.ai Docs:** https://docs.venice.ai
- **Venice.ai API Reference:** https://docs.venice.ai/api-reference
- **Venice.ai Discord:** Available via venice.ai website
- **AI SDK Docs:** https://sdk.vercel.ai

## Migration Date

**Completed:** 2025

## Contributors

This migration enables better feature support, cost optimization through model selection, and direct access to Venice.ai's privacy-focused infrastructure.
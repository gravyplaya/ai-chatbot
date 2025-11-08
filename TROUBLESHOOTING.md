# Troubleshooting Guide

Common issues and solutions when using Venice.ai with this chatbot application.

## API Errors

### "bad_request:api" Error

**Symptoms:**
```json
{
    "code": "bad_request:api",
    "message": "The request couldn't be processed. Please check your input and try again."
}
```

**Common Causes:**

1. **Missing or Invalid API Key**
   - Ensure `VENICE_API_KEY` is set in `.env.local`
   - Verify the API key is valid on [venice.ai/api](https://venice.ai/api)
   - Restart the development server after adding the key

2. **Insufficient Credits**
   - Check your Venice.ai account balance
   - Add credits at [venice.ai/billing](https://venice.ai/billing)

3. **Model Not Available**
   - Some models may be temporarily unavailable
   - Try a different model (Default, Fastest, Code, Vision, etc.)
   - Check Venice.ai status page for outages

4. **Invalid Parameters**
   - Parameters are passed via model feature suffixes (e.g., `model-id:param=value`)
   - Don't manually add `venice_parameters` to API calls
   - Parameters are configured in `lib/ai/providers.ts`

**Solution:**
```bash
# 1. Check your API key
cat .env.local | grep VENICE_API_KEY

# 2. Test API key with curl
curl --request GET \
  --url https://api.venice.ai/api/v1/models \
  --header "Authorization: Bearer YOUR_API_KEY"

# 3. Restart the server
pnpm dev
```

### "unauthorized" Error

**Symptoms:**
- 401 Unauthorized responses
- "Invalid API key provided"

**Solution:**
1. Verify `VENICE_API_KEY` is correctly set
2. Check for extra spaces or quotes in the API key
3. Regenerate API key if needed
4. Ensure API key has proper permissions

```bash
# Correct format in .env.local (no quotes)
VENICE_API_KEY=sk-your-actual-key-here
```

### Rate Limit Errors

**Symptoms:**
- 429 Too Many Requests
- Rate limit exceeded messages

**Solution:**
1. Check your rate limits in Venice.ai dashboard
2. Implement request throttling if needed
3. Consider upgrading your plan for higher limits
4. Space out requests during testing

## Model Issues

### Model Not Loading or Displaying

**Symptoms:**
- Model selector shows "undefined" or blank
- Models not appearing in dropdown

**Causes:**
1. Failed to fetch models from Venice API
2. Network connectivity issues
3. Invalid model IDs in configuration

**Solution:**
1. Check browser console for errors
2. Verify network access to `api.venice.ai`
3. App falls back to static models if API fetch fails
4. Check `lib/ai/models.ts` for correct model IDs

```typescript
// Static models are defined in lib/ai/models.ts
export const chatModels: ChatModel[] = [
  { id: "chat-model", name: "Default", ... },
  { id: "fastest-model", name: "Fastest", ... },
  // etc.
];
```

### Specific Model Not Working

**Symptoms:**
- One model works, another doesn't
- "Model not found" errors

**Solution:**
1. Check if the model ID is correct in `lib/ai/providers.ts`
2. Verify model availability:
```bash
curl --request GET \
  --url https://api.venice.ai/api/v1/models \
  --header "Authorization: Bearer YOUR_API_KEY" | jq '.data[] | .id'
```
3. Some models require specific subscriptions
4. Update model ID if Venice renamed/deprecated the model

## Feature Issues

### Web Search Not Working

**Symptoms:**
- Responses don't include web search results
- No citations appearing

**Causes:**
1. Web search disabled in model suffix
2. Model doesn't support web search
3. Rate limits on web search

**Solution:**
Check the model suffix in `lib/ai/providers.ts`:

```typescript
// Should include enable_web_search=auto or =on
"chat-model": veniceProvider.languageModel(
  "llama-3.3-70b:enable_web_search=auto&enable_web_citations=true"
),
```

To disable web search (for faster responses):
```typescript
"fastest-model": veniceProvider.languageModel(
  "llama-3.2-3b:enable_web_search=off"
),
```

### Reasoning/Thinking Blocks Not Showing

**Symptoms:**
- Reasoning model doesn't show thought process
- "Thinking..." blocks not appearing

**Solution:**
Ensure reasoning model has correct suffix:

```typescript
"chat-model-reasoning": veniceProvider.languageModel(
  "deepseek-r1-671b:enable_web_search=auto&strip_thinking_response=false"
),
```

To hide thinking blocks:
```typescript
// Change strip_thinking_response=false to true
"deepseek-r1-671b:strip_thinking_response=true"
```

### Vision Model Not Processing Images

**Symptoms:**
- Images not being analyzed
- Vision model treats images as text

**Causes:**
1. Wrong model selected (not vision-capable)
2. Image format not supported
3. Image too large

**Solution:**
1. Use `vision-model` (Mistral 3.1 24B)
2. Supported formats: JPEG, PNG, WebP
3. Check image size limits in Venice docs
4. Verify image upload is working in UI

## Environment Issues

### "VENICE_API_KEY not set" Error

**Solution:**
```bash
# 1. Create .env.local if it doesn't exist
cp .env.example .env.local

# 2. Add your API key
echo "VENICE_API_KEY=your-key-here" >> .env.local

# 3. Restart the server
pnpm dev
```

### Changes Not Taking Effect

**Symptoms:**
- Updated model configuration but nothing changed
- New parameters not working

**Solution:**
1. **Restart the development server** (required for `.env.local` changes)
```bash
# Stop the server (Ctrl+C)
pnpm dev
```

2. **Clear Next.js cache**
```bash
rm -rf .next
pnpm dev
```

3. **Check file saved correctly**
```bash
cat lib/ai/providers.ts | grep "venice-uncensored"
```

## Performance Issues

### Slow Response Times

**Causes:**
1. Using large models (405B, 671B)
2. Web search enabled (adds latency)
3. Network connectivity
4. Server load

**Solutions:**

1. **Use faster models for simple queries:**
```typescript
// Fastest model (~0.5-1s response time)
"fastest-model": veniceProvider.languageModel("llama-3.2-3b")

// Default model (~1-3s response time)
"chat-model": veniceProvider.languageModel("llama-3.3-70b")

// Reasoning model (~5-10s response time)
"chat-model-reasoning": veniceProvider.languageModel("deepseek-r1-671b")
```

2. **Disable web search for faster responses:**
```typescript
"model-id:enable_web_search=off"
```

3. **Optimize parameters:**
```typescript
// Reduce max_tokens for shorter responses
// Increase temperature for more creative (faster) responses
```

### High Token Usage / Costs

**Solutions:**
1. Use smaller models (3B, 24B instead of 70B+)
2. Limit context length
3. Disable web search when not needed
4. Monitor usage in Venice.ai dashboard

**Model Costs (per 1M tokens):**
```
Llama 3.2 3B:       $0.15 input / $0.60 output  ✅ Most economical
Llama 3.3 70B:      $0.70 input / $2.80 output  ⚖️ Balanced
DeepSeek R1 671B:   $3.50 input / $14.00 output ⚠️ Most expensive
```

## Database Issues

### "POSTGRES_URL not defined" Error

**Solution:**
```bash
# Add to .env.local
POSTGRES_URL=your_postgres_connection_string
```

### Chat History Not Saving

**Causes:**
1. Database connection issues
2. Missing migrations
3. Postgres URL incorrect

**Solution:**
```bash
# Run migrations
pnpm db:migrate

# Check database connection
pnpm db:studio
```

## Deployment Issues

### Vercel Deployment Fails

**Common Issues:**

1. **Missing Environment Variables**
   - Add `VENICE_API_KEY` in Vercel dashboard
   - Settings → Environment Variables → Add

2. **Build Errors**
```bash
# Test build locally first
pnpm build
```

3. **Runtime Errors**
   - Check Vercel logs: Settings → Logs
   - Verify all env vars are set
   - Check function timeout limits

### Other Platforms (Railway, Render, etc.)

1. Ensure `VENICE_API_KEY` is set in environment
2. Set `NODE_ENV=production`
3. Run database migrations before deployment
4. Check platform-specific timeout limits

## Getting Help

### Check Logs

**Browser Console:**
```
F12 → Console tab → Look for errors
```

**Server Logs:**
```bash
# Development
pnpm dev
# Watch for errors in terminal

# Production
# Check platform logs (Vercel, Railway, etc.)
```

### Verify Configuration

```bash
# Check model configuration
cat lib/ai/providers.ts

# Check environment variables (redacted)
cat .env.local | grep -v "=" | cut -d= -f1

# Test API connection
curl --request GET \
  --url https://api.venice.ai/api/v1/models \
  --header "Authorization: Bearer $VENICE_API_KEY"
```

### Debug Mode

Add console logs for debugging:

```typescript
// lib/ai/providers.ts
console.log("Venice API Key:", VENICE_API_KEY ? "✓ Set" : "✗ Missing");

// app/(chat)/api/chat/route.ts
console.log("Selected model:", selectedChatModel);
console.log("Model ID:", myProvider.languageModel(selectedChatModel).modelId);
```

### Community Support

- **Venice.ai Discord**: Join via [venice.ai](https://venice.ai)
- **Venice.ai Docs**: [docs.venice.ai](https://docs.venice.ai)
- **GitHub Issues**: Report bugs in this repository
- **AI SDK Docs**: [sdk.vercel.ai](https://sdk.vercel.ai)

## Quick Diagnostics Checklist

Run through this checklist when troubleshooting:

- [ ] `VENICE_API_KEY` is set in `.env.local`
- [ ] Development server restarted after env changes
- [ ] API key is valid (test with curl)
- [ ] Account has sufficient credits
- [ ] Model IDs are correct in `lib/ai/providers.ts`
- [ ] Network can reach `api.venice.ai`
- [ ] No TypeScript errors: `pnpm type-check`
- [ ] Database connected: `pnpm db:studio`
- [ ] Browser console shows no errors
- [ ] Using correct model suffix format

## Still Having Issues?

1. **Check Venice.ai Status**: [status.venice.ai](https://status.venice.ai) (if available)
2. **Review Documentation**: `VENICE_SETUP.md` and `MIGRATION_SUMMARY.md`
3. **Test with curl**: Verify API access directly
4. **Try Default Model**: Switch to `chat-model` (Llama 3.3 70B)
5. **Check Version**: Ensure dependencies are up to date
6. **Report Bug**: Create GitHub issue with full error details

---

**Last Updated**: 2025
**Venice.ai Version**: v1 API
**AI SDK Version**: 5.0.26
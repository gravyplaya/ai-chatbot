import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("=== Venice.ai Test Script ===");

// Check environment
const apiKey = process.env.VENICE_API_KEY;
if (!apiKey) {
  console.error("❌ VENICE_API_KEY not found in environment");
  process.exit(1);
}

console.log("✅ VENICE_API_KEY found:", apiKey.substring(0, 10) + "...");

// Create Venice provider
const veniceProvider = createOpenAICompatible({
  apiKey,
  baseURL: "https://api.venice.ai/api/v1",
  name: "venice",
});

console.log("✅ Venice provider created");

// Test models
const models = [
  { id: "llama-3.3-70b", name: "Llama 3.3 70B (Default)" },
  { id: "venice-uncensored", name: "Venice Uncensored" },
  { id: "llama-3.2-3b", name: "Llama 3.2 3B (Fast)" },
];

async function testModel(modelId, modelName) {
  console.log(`\n--- Testing ${modelName} (${modelId}) ---`);

  try {
    const startTime = Date.now();

    const { text, usage } = await generateText({
      model: veniceProvider.languageModel(modelId),
      prompt: "Tell me a short joke",
      maxTokens: 100,
    });

    const duration = Date.now() - startTime;

    console.log("✅ Success!");
    console.log("Response time:", duration + "ms");
    console.log("Tokens used:", usage?.totalTokens || "N/A");
    console.log("Response:", text.substring(0, 100) + "...");

    return true;
  } catch (error) {
    console.log("❌ Error:", error.message);
    if (error.message?.includes("401")) {
      console.log("   → Authentication failed - check API key");
    } else if (error.message?.includes("400")) {
      console.log("   → Bad request - check model ID or parameters");
    } else if (error.message?.includes("404")) {
      console.log("   → Model not found - check model ID");
    } else if (error.message?.includes("429")) {
      console.log("   → Rate limited - too many requests");
    }
    return false;
  }
}

// Run tests
async function runTests() {
  console.log("\nStarting tests...\n");

  const results = [];

  for (const model of models) {
    const success = await testModel(model.id, model.name);
    results.push({ model: model.name, success });

    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n=== Test Summary ===");
  results.forEach(({ model, success }) => {
    console.log(`${success ? "✅" : "❌"} ${model}`);
  });

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`\n${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("⚠️  Some tests failed - check errors above");
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});

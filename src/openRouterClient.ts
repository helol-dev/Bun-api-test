import { OpenRouter } from "@openrouter/sdk";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
}

export const openRouter = new OpenRouter({
    apiKey,
});

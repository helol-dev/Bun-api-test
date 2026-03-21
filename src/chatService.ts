import { openRouter } from "./openRouterClient";

export async function streamChatMessage(userMessage: string) {
    console.log("[streamChatMessage] Calling OpenRouter API with message:", userMessage.substring(0, 50));
    try {
        const result = await openRouter.chat.send({
            chatGenerationParams: {
                model: "openrouter/free",
                messages: [
                    { role: "user", content: userMessage },
                ],
                stream: true,
            },
        });
        console.log("[streamChatMessage] Got response from OpenRouter");
        return result;
    } catch (error) {
        console.error("[streamChatMessage] OpenRouter error:", error);
        throw error;
    }
}

export async function sendChatMessage(userMessage: string) {
    const stream = await streamChatMessage(userMessage);

    let responseText = "";
    let usage = null;

    for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
            responseText += content;
        }

        if (chunk.usage) {
            usage = chunk.usage;
        }
    }

    return {
        text: responseText,
        usage,
    };
}

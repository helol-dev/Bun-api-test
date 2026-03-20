import { openRouter } from "./openRouterClient";

export async function sendChatMessage(userMessage: string) {
    const stream = await openRouter.chat.send({
        chatGenerationParams: {
            model: "openrouter/free",
            messages: [
                { role: "user", content: userMessage },
            ],
            stream: true,
        },
    });

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

import { streamChatMessage } from "./chatService";

export async function chatHandler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    console.log(`[chatHandler] ${req.method} ${url.pathname}`);

    let message: string;
    if (req.method === "POST") {
        let body;
        try {
            body = await req.json() as { message?: unknown; content?: unknown };
        } catch (error) {
            console.error("[chatHandler] JSON parse error:", error);
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        message = typeof body?.message === "string"
            ? body.message.trim()
            : typeof body?.content === "string"
                ? body.content.trim()
                : "";
    } else if (req.method === "GET") {
        message = url.searchParams.get("message")?.trim() || url.searchParams.get("content")?.trim() || "";
    } else {
        console.warn("[chatHandler] Method not allowed:", req.method);
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!message) {
        console.warn("[chatHandler] No message provided");
        return new Response(JSON.stringify({ error: "message is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    console.log("[chatHandler] Processing message:", message.substring(0, 50));

    try {
        console.log("[chatHandler] Calling streamChatMessage...");
        const stream = await streamChatMessage(message);
        console.log("[chatHandler] Got stream, creating ReadableStream...");

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    let chunkCount = 0;
                    for await (const chunk of stream) {
                        chunkCount++;
                        const content = chunk.choices?.[0]?.delta?.content;
                        if (content) {
                            console.log(`[chatHandler] Chunk ${chunkCount}:`, content);
                            controller.enqueue(new TextEncoder().encode(content));
                        }
                    }
                    console.log(`[chatHandler] Stream complete. Total chunks: ${chunkCount}`);
                    controller.close();
                } catch (err) {
                    console.error("[chatHandler] ReadableStream error:", err);
                    controller.error(err);
                }
            },
            cancel() {
                console.log("[chatHandler] Stream cancelled by client");
            },
        });

        console.log("[chatHandler] Returning response stream");
        return new Response(readable, {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        console.error("[chatHandler] Error:", error);
        return new Response(
            JSON.stringify({ error: "OpenRouter request failed", detail: error instanceof Error ? error.message : String(error) }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

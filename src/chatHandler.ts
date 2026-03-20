import { streamChatMessage } from "./chatService";

export async function chatHandler(req: Request): Promise<Response> {
    const url = new URL(req.url);

    let message: string;
    if (req.method === "POST") {
        let body;
        try {
            body = await req.json() as { message?: unknown; content?: unknown };
        } catch (error) {
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
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!message) {
        return new Response(JSON.stringify({ error: "message is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const stream = await streamChatMessage(message);

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices?.[0]?.delta?.content;
                        if (content) {
                            controller.enqueue(new TextEncoder().encode(content));
                        }
                    }
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            },
            cancel() {
                // Si se quiere, se puede cerrar conexión de OpenRouter si se expone.
            },
        });

        return new Response(readable, {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "OpenRouter request failed", detail: error instanceof Error ? error.message : String(error) }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

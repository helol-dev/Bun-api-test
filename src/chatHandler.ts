import { sendChatMessage } from "./chatService";

export async function chatHandler(req: Request): Promise<Response> {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    let body;
    try {
        body = await req.json();
    } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
        return new Response(JSON.stringify({ error: "message is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const result = await sendChatMessage(message);

        return new Response(JSON.stringify({ result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "OpenRouter request failed", detail: error?.message ?? String(error) }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

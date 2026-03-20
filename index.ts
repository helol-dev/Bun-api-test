
import { serve } from "bun";
import { chatHandler } from "./src/chatHandler";

serve({
    port: Number(process.env.PORT || 3000),
    async fetch(req) {
        const url = new URL(req.url);

        if (req.method === "GET" && url.pathname === "/health") {
            return new Response(JSON.stringify({ status: "ok" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (url.pathname === "/chat") {
            return await chatHandler(req);
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);

import { serve } from "bun";

serve({
    port: process.env.PORT || 3001,
    fetch(req) {
        const url = new URL(req.url);
        if (req.method === "GET" && url.pathname === "/health") {
            return new Response(JSON.stringify({ status: "ok" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
        return new Response("Not Found", { status: 404 });
    },
});

console.log("Server is running on http://localhost:3001");
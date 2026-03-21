
import { serve } from "bun";
import { chatHandler } from "./src/chatHandler";

serve({
    port: Number(process.env.PORT || 3000),
    async fetch(req) {
        const url = new URL(req.url);
        console.log(`[fetch] ${req.method} ${url.pathname}`);

        if (req.method === "GET" && url.pathname === "/health") {
            return new Response(JSON.stringify({ status: "ok" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (url.pathname === "/chat") {
            return await chatHandler(req);
        }

        // Servir archivos estáticos desde public/
        if (req.method === "GET") {
            let filePath = url.pathname;
            if (filePath === "/" || filePath === "") {
                filePath = "/index.html";
            }

            const file = Bun.file(`./public${filePath}`);
            if (await file.exists()) {
                const mimeType = getMimeType(filePath);
                return new Response(file, {
                    headers: { "Content-Type": mimeType },
                });
            }
        }

        return new Response("Not Found", { status: 404 });
    },
});

function getMimeType(filePath: string): string {
    if (filePath.endsWith(".html")) return "text/html";
    if (filePath.endsWith(".css")) return "text/css";
    if (filePath.endsWith(".js")) return "application/javascript";
    if (filePath.endsWith(".json")) return "application/json";
    if (filePath.endsWith(".png")) return "image/png";
    if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
    if (filePath.endsWith(".svg")) return "image/svg+xml";
    return "application/octet-stream";
}

console.log(`Server is running http://localhost:${process.env.PORT || 3000}`);
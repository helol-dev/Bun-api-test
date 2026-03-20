const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const responseOutput = document.getElementById("responseOutput");
const chatArea = document.getElementById("chatArea");

console.log("DOM Elements loaded:", { messageInput, sendBtn, responseOutput, chatArea });

if (!messageInput || !sendBtn || !responseOutput || !chatArea) {
    console.error("Missing critical DOM elements!");
}

sendBtn.addEventListener("click", () => {
    console.log("Send button clicked");
    sendMessage();
});

messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !sendBtn.disabled) {
        console.log("Enter key pressed");
        sendMessage();
    }
});

async function sendMessage() {
    console.log("sendMessage() called");
    const message = messageInput.value.trim();
    if (!message) {
        alert("Por favor escribe un mensaje");
        return;
    }

    console.log("Sending message:", message);
    sendBtn.disabled = true;
    messageInput.disabled = true;
    responseOutput.classList.remove("empty");

    // Agrega burbuja de usuario
    const userBubble = document.createElement("div");
    userBubble.className = "bubble user";
    userBubble.textContent = message;
    responseOutput.appendChild(userBubble);

    // Burbujas de bot
    const botBubble = document.createElement("div");
    botBubble.className = "bubble bot";
    botBubble.textContent = "Escribiendo...";
    responseOutput.appendChild(botBubble);

    chatArea.scrollTop = chatArea.scrollHeight;

    try {
        console.log("Fetching /chat endpoint...");
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
        });

        console.log("Response status:", response.status, response.ok);

        if (!response.ok) {
            let errorData = { error: "Unknown error" };
            try {
                errorData = await response.json();
            } catch (_) {}
            const errorMsg = `Error ${response.status}: ${errorData.error || "Unknown error"}`;
            botBubble.textContent = errorMsg;
            botBubble.classList.add("error");
            showToast(errorMsg);
            console.error(errorMsg);
            return;
        }

        if (!response.body) {
            botBubble.textContent = "Error: no response body from server";
            botBubble.classList.add("error");
            showToast("Error: no response body from server");
            console.error("No response body");
            return;
        }

        console.log("Starting to read response stream...");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = [];
        let isStreaming = true;

        botBubble.textContent = "";

        // Mostrar caracteres conforme llegan
        const displayQueue = async () => {
            while (isStreaming || buffer.length > 0) {
                if (buffer.length > 0) {
                    const char = buffer.shift();
                    botBubble.textContent += char;
                    chatArea.scrollTop = chatArea.scrollHeight;
                    await new Promise((resolve) => setTimeout(resolve, 6));
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 40));
                }
            }
        };

        const displayQueuePromise = displayQueue();

        let chunkCount = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log("Stream done. Total chunks:", chunkCount);
                break;
            }

            chunkCount++;
            const text = decoder.decode(value, { stream: true });
            console.log(`Chunk ${chunkCount}:`, text);
            for (let char of text) {
                buffer.push(char);
            }
        }

        isStreaming = false;
        await displayQueuePromise;
        messageInput.value = "";
        console.log("Message processing complete");
        showToast("✓ Respuesta completada");
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        botBubble.textContent = `Error: ${msg}`;
        botBubble.classList.add("error");
        showToast(`Error: ${msg}`);
        console.error("sendMessage error:", error);
    } finally {
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 3600);
}


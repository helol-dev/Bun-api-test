const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const responseOutput = document.getElementById("responseOutput");
const loadingSpinner = document.getElementById("loadingSpinner");

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !sendBtn.disabled) {
        sendMessage();
    }
});

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) {
        alert("Por favor escribe un mensaje");
        return;
    }

    sendBtn.disabled = true;
    messageInput.disabled = true;
    responseOutput.textContent = "";
    responseOutput.classList.remove("empty");
    loadingSpinner.classList.remove("hidden");

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            responseOutput.textContent = `Error ${response.status}: ${errorData.error || "Unknown error"}`;
            responseOutput.classList.add("error");
            loadingSpinner.classList.add("hidden");
            return;
        }

        loadingSpinner.classList.add("hidden");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = [];
        let isStreaming = true;

        // Mostrar caracteres conforme llegan
        const displayQueue = async () => {
            while (isStreaming || buffer.length > 0) {
                if (buffer.length > 0) {
                    const char = buffer.shift();
                    responseOutput.textContent += char;
                    responseOutput.parentElement.scrollTop = responseOutput.parentElement.scrollHeight;
                    await new Promise(resolve => setTimeout(resolve, 10)); // Pequeño delay para efecto visual
                } else {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        };

        const displayQueuePromise = displayQueue();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            for (let char of text) {
                buffer.push(char);
            }
        }

        isStreaming = false;
        await displayQueuePromise;
        messageInput.value = "";
    } catch (error) {
        loadingSpinner.classList.add("hidden");
        responseOutput.textContent = `Error: ${error.message}`;
        console.error(error);
    } finally {
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
}

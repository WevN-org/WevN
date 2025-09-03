//export async function fetchStreamingResponse(prompt, onUpdate) {
//    const response = await fetch("http://localhost:8000/chat", {
//        method: "POST",
//        headers: { "Content-Type": "application/json" },
//        body: JSON.stringify({ prompt }),
//    });
//
//    const reader = response.body.getReader();
//    const decoder = new TextDecoder("utf-8");
//    let buffer = "";
//
//    while (true) {
//        const { done, value } = await reader.read();
//        if (done) break;
//
//        buffer += decoder.decode(value, { stream: true });
//        onUpdate(buffer);
//    }
//
//    return buffer;
//}

// Temporary fake implementation.
// Later replace ONLY the inside with real backend fetch.
export async function fetchStreamingResponse(prompt, onUpdate) {
    const fakeText = `Simulated AI response to: "${prompt}".
This is streaming word by word to mimic a real LLM.`

    const words = fakeText.split(" ");
    let current = "";

    for (let i = 0; i < words.length; i++) {
        await new Promise((r) => setTimeout(r, 150)); // 80ms per word
        current += (i === 0 ? "" : " ") + words[i];
        onUpdate(current);
    }

    return fakeText;
}

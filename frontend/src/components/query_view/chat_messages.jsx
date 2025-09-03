import { useEffect, useRef } from "react";

export default function ChatMessages({ messages }) {
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full">
            {messages.map((msg, idx) => (
                <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                    <div
                        className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm shadow
              ${msg.role === "user"
                                ? "bg-emerald-500 text-white rounded-br-none"
                                : "bg-gray-200 text-gray-900 rounded-bl-none"
                            }`}
                    >
                        {msg.content}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}

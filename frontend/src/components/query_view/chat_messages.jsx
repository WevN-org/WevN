import clsx from "clsx";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ChatMessages({ messages, graphVisibility }) {
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div
            className={clsx(
                "overflow-y-auto p-4 space-y-4 max-h-[90%] pt-14 transition-all duration-500",
                {
                    "w-1/2 mx-auto": !graphVisibility,
                }
            )}
        >
            {messages.map((msg, idx) => (
                <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                    <div
                        className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm shadow prose prose-sm break-words
                            ${msg.role === "user"
                                ? "bg-emerald-500 text-white rounded-br-none prose-invert"
                                : "bg-gray-200 text-gray-900 rounded-bl-none"
                            }`}
                    >
                        <ReactMarkdown
                            children={msg.content}
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    return !inline && match ? (
                                        <SyntaxHighlighter
                                            children={String(children).replace(/\n$/, "")}
                                            style={materialDark}
                                            language={match[1]}
                                            PreTag="div"
                                            {...props}
                                        />
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        />
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}

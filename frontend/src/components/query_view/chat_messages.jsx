import clsx from "clsx";
import { useEffect, useRef, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";


// --- Utility: Normalize math delimiters (\(...\), \[...\]) into $...$ / $$...$$ ---
function normalizeMathDelimiters(text) {
  if (!text) return text;

  return text
    .replace(/```math([\s\S]*?)```/g, (_, m) => `$$${m}$$`)
    .replace(/\$`([^`]+?)`\$/g, (_, m) => `$${m}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `$$${m}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m}$`);
}



// --- Step 1: Create a dedicated component for a single chat bubble ---

function ChatMessageBubble({ message }) {
  const [isThinkingVisible, setIsThinkingVisible] = useState(false);

  // Parse the message content to separate the thinking from the answer
  const { thinkingText, answerText } = useMemo(() => {
    const match = /<think>([\s\S]*?)<\/think>([\s\S]*)/.exec(message.content);

    if (match) {
      return {
        thinkingText: normalizeMathDelimiters(match[1].trim()),
        answerText: normalizeMathDelimiters(match[2].trim()),
      };
    } else {
      return {
        thinkingText: null,
        answerText: normalizeMathDelimiters(message.content.trim()),
      };
    }
  }, [message.content]);

  const toggleThinkingVisibility = () => {
    setIsThinkingVisible((prev) => !prev);
  };

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={clsx(
          "px-4 py-2 rounded-2xl max-w-[75%] text-sm shadow prose prose-sm break-words overflow-x-auto",
          {
            "bg-emerald-500 text-white rounded-br-none prose-invert": message.role === "user",
            "bg-gray-200 text-gray-900 rounded-bl-none": message.role !== "user",
          }
        )}
      >
        {/* --- Always render the main answer --- */}
        <ReactMarkdown
          children={answerText}
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  children={String(children).replace(/\n$/, "")}
                  style={materialDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ overflowX: "auto" }}
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

        {/* --- Collapsible Thinking Section --- */}
        {thinkingText && (
          <div className="mt-2 pt-2 border-t border-gray-500/30">
            <button
              onClick={toggleThinkingVisibility}
              className="text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity"
            >
              {isThinkingVisible ? "Hide thought process" : "Show thought process"}
            </button>
            {isThinkingVisible && (
              <div className="mt-1 text-xs prose-p:my-1">
                <ReactMarkdown
                  children={thinkingText}
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// --- Step 2: Simplify your main ChatMessages component ---

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
        <ChatMessageBubble key={idx} message={msg} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

import { useState } from "react";
import GraphContainer from "./graph_container";
import PromptContainer from "./prompt_container";
import ChatMessages from "./chat_messages";
import clsx from "clsx";

export default function QueryView({ state, setState }) {
    const [graphVisibility, setGraphVisibility] = useState(true);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! Ask me anything about your knowledgebase." },
    ]);

    const toggleGraphView = () => setGraphVisibility((prev) => !prev);

    const handleSend = (text) => {
        // Add user message
        setMessages((prev) => [...prev, { role: "user", content: text }]);

        // Add dummy assistant response (replace with backend call)
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `You said: "${text}"` },
            ]);
        }, 800);
    };

    return (
        <main
            id="query-view"
            className={clsx(
                "main-content relative h-screen flex flex-col md:flex-row",
                {
                    "justify-center w-full": graphVisibility,
                    "w-full": !graphVisibility,
                }
            )}
        >
            {/* Graph */}
            <GraphContainer
                isVisible={graphVisibility}
                className="w-full md:w-[40%] h-64 md:h-auto md:order-last"
            >
                <div className="d3-placeholder">
                    Interactive D3.js Graph Visualization
                    <p className="text-sm mt-3">
                        Nodes and edges will be rendered here based on your query.
                    </p>
                </div>
            </GraphContainer>

            {/* Chat */}
            <div
                id="chat-window"
                className={clsx(
                    "relative flex flex-col h-full flex-1 order-last md:order-first",
                    { "flex-grow": !graphVisibility }
                )}
            >
                <ChatMessages messages={messages} />
                <PromptContainer
                    graphVisibility={graphVisibility}
                    toggleGraph={toggleGraphView}
                    state={state}
                    setState={setState}
                    onSend={handleSend}   // pass callback
                />
            </div>
        </main>
    );
}

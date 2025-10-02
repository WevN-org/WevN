import { useState } from "react";
import GraphContainer from "./graph_container";
import PromptContainer from "./prompt_container";
import ChatMessages from "./chat_messages";
import clsx from "clsx";

export default function QueryView({ state, setState }) {
    const [graphVisibility, setGraphVisibility] = useState(true);

    const toggleGraphView = () => setGraphVisibility((prev) => !prev);

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
            <GraphContainer isVisible={graphVisibility} className="w-full md:w-[40%] h-64 md:h-auto md:order-last" />

            {/* Chat */}
            <div
                id="chat-window"
                className={clsx(
                    "relative flex flex-col h-full flex-1 order-last md:order-first transition-all duration-500",
                    { "flex-grow": !graphVisibility }
                )}
            >
                <ChatMessages graphVisibility={graphVisibility} />   {/* use state.messages */}
                <PromptContainer
                    graphVisibility={graphVisibility}
                    toggleGraph={toggleGraphView}
                    setState={setState}   // no need to pass full state
                />
            </div>
        </main>
    );
}

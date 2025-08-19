import { useState } from "react";
import GraphContainer from "./graph_container";
import AnswerBox from "./answer_box";
import PromptContainer from "./prompt_container";
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
                    "gap-4 justify-center w-full": graphVisibility,
                    "w-full": !graphVisibility,
                }
            )}
        >
            {/* Graph goes on top on small screens, and is ordered last on md+ */}
            <GraphContainer
                visible={graphVisibility}
                className="w-full md:w-[40%] h-64 md:h-auto md:order-last"
            >
                <div className="d3-placeholder">
                    Interactive D3.js Graph Visualization
                    <p className="text-sm mt-3">
                        Nodes and edges will be rendered here based on your query.
                    </p>
                </div>
            </GraphContainer>

            <div
                className={clsx(
                    "relative flex flex-col h-full items-center flex-1 order-last md:order-first",
                    { "flex-grow": !graphVisibility }
                )}
            >
                <AnswerBox>
                    Your textual answer will appear here, providing a detailed summary of the retrieved information.
                </AnswerBox>
                <PromptContainer
                    graphVisibility={graphVisibility}
                    toggleGraph={toggleGraphView}
                    state={state}
                    setState={setState}
                />
            </div>
        </main>

    );
}

import { useState } from "react";
import GraphContainer from "./graph_container";
import AnswerBox from "./answer_box";
import PromptBox from "./prompt_box";

export default function QueryView({ state, setState }) {
    const [graphVisibility, setGraphVisibility] = useState(true);

    const toggleGraphView = () => setGraphVisibility((prev) => !prev);

    return (
        <main id="query-view" className="main-content relative flex-1 h-screen flex flex-col p-3">

            <div className={`flex flex-1 overflow-y-auto  pb-4 ${graphVisibility && 'gap-4'}`}>
                <GraphContainer visible={graphVisibility}>
                    <div className="d3-placeholder">
                        Interactive D3.js Graph Visualization
                        <p className="text-sm mt-3">
                            Nodes and edges will be rendered here based on your query.
                        </p>
                    </div>
                </GraphContainer>

                <AnswerBox>
                    Your textual answer will appear here, providing a detailed summary of the retrieved information.
                </AnswerBox>
            </div>

            <PromptBox
                graphVisibility={graphVisibility}
                toggleGraph={toggleGraphView}
                state={state}
                setState={setState}
            />
        </main>
    );
}

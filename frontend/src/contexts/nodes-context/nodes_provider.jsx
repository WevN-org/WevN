import { useCallback, useState } from "react";
import { NodesContext } from "./nodes_context";
import { useLog } from "../log-context/log_context";

export default function NodesProvider({ children }) {
    const [nodesList, setNodesList] = useState([]);  // default empty array
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { addLog } = useLog();

    const setNodes = useCallback(
        (nodes) => {
            try {
                setIsLoading(true);
                setError(null);

                setNodesList(nodes);
                addLog("Updated list of nodes");
            } catch (err) {
                setError(err.message || "Unknown error");
            } finally {
                setIsLoading(false);
            }
        },
        [addLog]
    );

    return (
        <NodesContext.Provider value={{ nodesList, setNodes, isLoading, error }}>
            {children}
        </NodesContext.Provider>
    );
}

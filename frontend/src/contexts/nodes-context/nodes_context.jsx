import { createContext, useContext } from "react";

/**
 * Context for managing nodes globally.
 * @typedef {Object} NodesContextType
 * @property {Array} nodesList - List of nodes.
 * @property {(nodes: Array) => void} setNodes - Function to update the nodes.
 * @property {boolean} isLoading - Whether nodes are being loaded.
 * @property {string|null} error - Error message if loading/updating failed.
 */

export const NodesContext = createContext({
    nodesList: [],
    setNodes: () => { },
    isLoading: false,
    error: null
});

/**
 * Hook to consume the NodesContext
 * @returns {NodesContextType}
 */
export function useNodes() {
    return useContext(NodesContext);
}

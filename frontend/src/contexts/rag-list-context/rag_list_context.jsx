// rag_list_context.js
import { createContext, useContext } from "react";

/**
 * Context for managing rag list globally.
 * @typedef {Object} RagListContextType
 * @property {Array} ragList - List of items.
 * @property {(list: Array) => void} setRagList - Function to update the list.
 */
export const RagContext = createContext({
  ragList: [],
  setRagList: () => {},
});

/**
 * Hook to consume the RagContext
 * @returns {RagListContextType}
 */
export function useRagList() {
  return useContext(RagContext);
}

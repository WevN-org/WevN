// RagListProvider.js
import React, { useState, useCallback } from "react";
import { RagContext } from "./rag_list_context";

export function RagListProvider({ children }) {
  const [ragList, setRagList] = useState([]);

  // Stable setter
  const updateList = useCallback((list) => {
    setRagList(list);
  }, []);

  return (
    <RagContext.Provider value={{ ragList, setRagList: updateList }}>
      {children}
    </RagContext.Provider>
  );
}

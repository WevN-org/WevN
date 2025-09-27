import React, { useState, useCallback, useMemo } from "react";
import { DomainsListContext } from "./domains_list_context";

export function DomainsListProvider({ children }) {
  const [domainsState, setDomainsState] = useState([]);


  // Stable setDomains function
  const setDomains = useCallback((newDomains) => {
    setDomainsState(newDomains);
  }, []);

  // Memoize domains array reference to prevent unnecessary re-renders
  const domains = useMemo(() => domainsState, [domainsState]);

  return (
    <DomainsListContext.Provider value={{ domains, setDomains }}>
      {children}
    </DomainsListContext.Provider>
  );
}
